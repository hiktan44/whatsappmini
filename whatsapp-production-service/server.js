const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');
const cron = require('node-cron');
require('dotenv').config();

// Redis setup for production session management
let redisClient;
try {
    const redis = require('redis');
    const redisUrl = process.env.REDIS_URL || process.env.REDISCLOUD_URL || 'redis://localhost:6379';
    redisClient = redis.createClient({ url: redisUrl });
    redisClient.connect();
    console.log('✅ Redis bağlantısı kuruldu');
} catch (error) {
    console.warn('⚠️  Redis bulunamadı, in-memory storage kullanılıyor:', error.message);
    redisClient = null;
}

// Winston logger setup
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'whatsapp-web-service' },
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*'
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// Session storage abstraction
class SessionStore {
    constructor() {
        this.memoryStore = new Map();
    }

    async set(key, value, ttl = 3600) {
        try {
            if (redisClient) {
                await redisClient.setEx(key, ttl, JSON.stringify(value));
            } else {
                this.memoryStore.set(key, { value, expires: Date.now() + (ttl * 1000) });
            }
        } catch (error) {
            logger.error('Session store set error:', error);
            this.memoryStore.set(key, { value, expires: Date.now() + (ttl * 1000) });
        }
    }

    async get(key) {
        try {
            if (redisClient) {
                const data = await redisClient.get(key);
                return data ? JSON.parse(data) : null;
            } else {
                const item = this.memoryStore.get(key);
                if (item && item.expires > Date.now()) {
                    return item.value;
                }
                if (item) {
                    this.memoryStore.delete(key);
                }
                return null;
            }
        } catch (error) {
            logger.error('Session store get error:', error);
            return null;
        }
    }

    async delete(key) {
        try {
            if (redisClient) {
                await redisClient.del(key);
            } else {
                this.memoryStore.delete(key);
            }
        } catch (error) {
            logger.error('Session store delete error:', error);
        }
    }

    async getAllKeys() {
        try {
            if (redisClient) {
                return await redisClient.keys('session:*');
            } else {
                return Array.from(this.memoryStore.keys()).filter(key => key.startsWith('session:'));
            }
        } catch (error) {
            logger.error('Session store getAllKeys error:', error);
            return [];
        }
    }
}

const sessionStore = new SessionStore();
const clients = new Map(); // WhatsApp clients
const qrCodes = new Map(); // QR codes with expiry

// Health check endpoint with comprehensive status
app.get('/health', async (req, res) => {
    const health = {
        status: 'healthy',
        service: 'WhatsApp Web Production Service',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        sessions: {
            active: clients.size,
            qr_codes: qrCodes.size
        },
        storage: {
            type: redisClient ? 'Redis' : 'Memory',
            redis_connected: redisClient ? await redisClient.ping() === 'PONG' : false
        },
        environment: {
            node_version: process.version,
            platform: process.platform,
            port: PORT
        }
    };

    // Check if service is overloaded
    if (clients.size > 50) {
        health.status = 'degraded';
        health.warning = 'High session count';
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
});

// Initialize WhatsApp session with enhanced error handling
app.post('/api/init-session', async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ 
                error: 'User ID is required',
                code: 'MISSING_USER_ID'
            });
        }

        logger.info('Initializing WhatsApp session', { userId });

        const sessionId = `session_${userId}_${uuidv4()}`;
        
        // Check for existing active session
        const existingSessionData = await sessionStore.get(`session:${userId}`);
        if (existingSessionData && existingSessionData.status === 'connected') {
            logger.info('Existing session found', { userId, sessionId: existingSessionData.sessionId });
            return res.json({
                sessionId: existingSessionData.sessionId,
                status: 'already_connected',
                message: 'WhatsApp zaten bağlı',
                connectedAt: existingSessionData.connectedAt
            });
        }

        // Create new WhatsApp client with production settings
        const client = new Client({
            authStrategy: new LocalAuth({ 
                clientId: sessionId,
                dataPath: './sessions'
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor'
                ]
            },
            webVersionCache: {
                type: 'remote',
                remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
            }
        });

        // Store client and session data
        clients.set(sessionId, client);
        const sessionData = {
            sessionId,
            userId,
            status: 'initializing',
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString()
        };
        
        await sessionStore.set(`session:${userId}`, sessionData, 7200); // 2 hours TTL

        // Enhanced event handlers
        client.on('qr', async (qr) => {
            try {
                logger.info('QR Code generated', { sessionId });
                
                // Generate high-quality QR code
                const qrDataUrl = await QRCode.toDataURL(qr, {
                    width: 512,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    },
                    errorCorrectionLevel: 'H'
                });
                
                // Store QR with metadata
                const qrData = {
                    qrString: qr,
                    qrDataUrl: qrDataUrl,
                    expiresAt: new Date(Date.now() + 45000).toISOString(),
                    generatedAt: new Date().toISOString(),
                    sessionId,
                    userId
                };
                
                qrCodes.set(sessionId, qrData);
                
                // Update session status
                sessionData.status = 'waiting_for_scan';
                sessionData.qrGenerated = true;
                sessionData.lastActivity = new Date().toISOString();
                await sessionStore.set(`session:${userId}`, sessionData, 7200);
                
                logger.info('QR code stored', { sessionId, expiresAt: qrData.expiresAt });
                
            } catch (error) {
                logger.error('QR Code generation error', { error: error.message, sessionId });
            }
        });

        client.on('authenticated', async () => {
            logger.info('WhatsApp authenticated', { sessionId });
            sessionData.status = 'authenticated';
            sessionData.lastActivity = new Date().toISOString();
            await sessionStore.set(`session:${userId}`, sessionData, 7200);
        });

        client.on('ready', async () => {
            logger.info('WhatsApp client ready', { sessionId });
            sessionData.status = 'connected';
            sessionData.connectedAt = new Date().toISOString();
            sessionData.lastActivity = new Date().toISOString();
            await sessionStore.set(`session:${userId}`, sessionData, 86400); // 24 hours for connected sessions
            
            // Clean up QR code after successful connection
            qrCodes.delete(sessionId);
        });

        client.on('disconnected', async (reason) => {
            logger.warn('WhatsApp disconnected', { sessionId, reason });
            sessionData.status = 'disconnected';
            sessionData.disconnectedAt = new Date().toISOString();
            sessionData.disconnectReason = reason;
            await sessionStore.set(`session:${userId}`, sessionData, 3600);
            
            // Cleanup
            clients.delete(sessionId);
            qrCodes.delete(sessionId);
        });

        client.on('auth_failure', async (message) => {
            logger.error('Authentication failed', { sessionId, message });
            sessionData.status = 'auth_failed';
            sessionData.errorMessage = message;
            await sessionStore.set(`session:${userId}`, sessionData, 3600);
        });

        // Initialize with timeout
        const initTimeout = setTimeout(() => {
            if (sessionData.status === 'initializing') {
                logger.error('Session initialization timeout', { sessionId });
                client.destroy();
                clients.delete(sessionId);
            }
        }, 60000); // 60 second timeout

        client.on('ready', () => clearTimeout(initTimeout));
        client.on('auth_failure', () => clearTimeout(initTimeout));

        // Initialize the client
        await client.initialize();

        res.json({
            sessionId,
            status: 'initializing',
            message: 'WhatsApp session başlatılıyor...',
            timestamp: new Date().toISOString(),
            estimatedTime: '30-60 saniye'
        });

    } catch (error) {
        logger.error('Session initialization error', { error: error.message, stack: error.stack });
        res.status(500).json({
            error: 'Session başlatma hatası',
            code: 'INIT_ERROR',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Enhanced QR code endpoint with caching
app.get('/api/qr-code/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        const qrData = qrCodes.get(sessionId);
        if (!qrData) {
            return res.status(404).json({ 
                error: 'QR kod bulunamadı',
                code: 'QR_NOT_FOUND',
                sessionId
            });
        }

        // Check expiry
        if (new Date() > new Date(qrData.expiresAt)) {
            qrCodes.delete(sessionId);
            return res.status(410).json({ 
                error: 'QR kod süresi doldu',
                code: 'QR_EXPIRED',
                sessionId
            });
        }

        // Set appropriate cache headers
        res.set({
            'Cache-Control': 'private, max-age=30',
            'ETag': `"${sessionId}-${qrData.generatedAt}"`
        });

        res.json({
            sessionId,
            qrString: qrData.qrString,
            qrDataUrl: qrData.qrDataUrl,
            expiresAt: qrData.expiresAt,
            generatedAt: qrData.generatedAt,
            timeRemaining: Math.max(0, new Date(qrData.expiresAt) - new Date()),
            isValid: true
        });

    } catch (error) {
        logger.error('QR code retrieval error', { error: error.message, sessionId: req.params.sessionId });
        res.status(500).json({
            error: 'QR kod alma hatası',
            code: 'QR_FETCH_ERROR',
            details: error.message
        });
    }
});

// Enhanced session status with detailed info
app.get('/api/session-status/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        const client = clients.get(sessionId);
        const qrData = qrCodes.get(sessionId);
        
        // Try to find session by sessionId or userId
        let sessionData = null;
        const sessionKeys = await sessionStore.getAllKeys();
        
        for (const key of sessionKeys) {
            const data = await sessionStore.get(key);
            if (data && data.sessionId === sessionId) {
                sessionData = data;
                break;
            }
        }

        if (!sessionData) {
            return res.status(404).json({ 
                error: 'Session bulunamadı',
                code: 'SESSION_NOT_FOUND',
                sessionId
            });
        }

        res.json({
            sessionId,
            status: sessionData.status,
            userId: sessionData.userId,
            createdAt: sessionData.createdAt,
            lastActivity: sessionData.lastActivity,
            connectedAt: sessionData.connectedAt,
            disconnectedAt: sessionData.disconnectedAt,
            hasQrCode: !!qrData,
            qrExpired: qrData ? new Date() > new Date(qrData.expiresAt) : null,
            clientActive: !!client,
            uptime: sessionData.connectedAt ? Date.now() - new Date(sessionData.connectedAt).getTime() : null,
            health: {
                memoryUsage: process.memoryUsage(),
                activeClients: clients.size
            }
        });

    } catch (error) {
        logger.error('Session status error', { error: error.message, sessionId: req.params.sessionId });
        res.status(500).json({
            error: 'Session durumu alma hatası',
            code: 'STATUS_ERROR',
            details: error.message
        });
    }
});

// Cleanup expired sessions and QR codes (runs every 5 minutes)
cron.schedule('*/5 * * * *', async () => {
    const now = new Date();
    
    // Clean expired QR codes
    let expiredQRs = 0;
    for (const [sessionId, qrData] of qrCodes.entries()) {
        if (now > new Date(qrData.expiresAt)) {
            qrCodes.delete(sessionId);
            expiredQRs++;
        }
    }
    
    // Clean old sessions
    let expiredSessions = 0;
    const sessionKeys = await sessionStore.getAllKeys();
    for (const key of sessionKeys) {
        const sessionData = await sessionStore.get(key);
        if (sessionData) {
            const lastActivity = new Date(sessionData.lastActivity);
            const maxAge = sessionData.status === 'connected' ? 86400000 : 3600000; // 24h vs 1h
            
            if (now - lastActivity > maxAge) {
                await sessionStore.delete(key);
                
                // Also cleanup client if exists
                const client = clients.get(sessionData.sessionId);
                if (client) {
                    try {
                        await client.destroy();
                    } catch (e) {
                        logger.warn('Error destroying client during cleanup', { sessionId: sessionData.sessionId });
                    }
                    clients.delete(sessionData.sessionId);
                }
                expiredSessions++;
            }
        }
    }
    
    if (expiredQRs > 0 || expiredSessions > 0) {
        logger.info('Cleanup completed', { expiredQRs, expiredSessions, activeClients: clients.size });
    }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    
    // Cleanup all clients
    const cleanupPromises = Array.from(clients.entries()).map(async ([sessionId, client]) => {
        try {
            await client.destroy();
        } catch (error) {
            logger.error('Error destroying client during shutdown', { sessionId, error: error.message });
        }
    });
    
    await Promise.all(cleanupPromises);
    
    if (redisClient) {
        await redisClient.quit();
    }
    
    process.exit(0);
});

// Error handling middleware
app.use((error, req, res, next) => {
    logger.error('Unhandled error', { error: error.message, stack: error.stack, url: req.url });
    res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    logger.info('🚀 WhatsApp Web Production Service started', {
        port: PORT,
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
        redis: !!redisClient
    });
    console.log(`🚀 WhatsApp Web Production Service: http://localhost:${PORT}`);
    console.log(`📊 Health Check: http://localhost:${PORT}/health`);
    console.log(`🔒 Security: Helmet + Rate limiting enabled`);
    console.log(`💾 Storage: ${redisClient ? 'Redis' : 'Memory (development only)'}`);
});

module.exports = app;