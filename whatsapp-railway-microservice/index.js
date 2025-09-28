const express = require('express');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Store active WhatsApp clients per user
const activeClients = new Map();
const qrCodes = new Map();
const sessionStatuses = new Map();

// Middleware to extract user ID from headers
const extractUserId = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(400).json({
      error: 'User ID required in X-User-ID header'
    });
  }
  req.userId = userId;
  next();
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'whatsapp-web-microservice',
    version: '1.0.0',
    activeClients: activeClients.size
  });
});

// Initialize WhatsApp session
app.post('/initialize-session', extractUserId, async (req, res) => {
  const userId = req.userId;
  
  try {
    console.log(`[${userId}] Initializing WhatsApp Web session...`);
    
    // Check if user already has an active client
    if (activeClients.has(userId)) {
      const existingClient = activeClients.get(userId);
      if (existingClient.info && existingClient.info.wid) {
        return res.json({
          session_id: userId,
          status: 'connected',
          is_connected: true,
          message: 'Session already active',
          last_connected_at: new Date().toISOString()
        });
      } else {
        // Clean up broken client
        await existingClient.destroy();
        activeClients.delete(userId);
        qrCodes.delete(userId);
        sessionStatuses.delete(userId);
      }
    }
    
    // Create new WhatsApp client
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: userId
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
          '--disable-gpu'
        ]
      }
    });
    
    // Store client
    activeClients.set(userId, client);
    sessionStatuses.set(userId, 'initializing');
    
    // QR Code event
    client.on('qr', async (qr) => {
      console.log(`[${userId}] QR Code generated`);
      try {
        const qrDataUrl = await QRCode.toDataURL(qr);
        qrCodes.set(userId, {
          qr: qr,
          qrDataUrl: qrDataUrl,
          expires_at: new Date(Date.now() + 60000).toISOString() // 1 minute
        });
        sessionStatuses.set(userId, 'waiting_for_scan');
        console.log(`[${userId}] QR Code stored and ready`);
      } catch (error) {
        console.error(`[${userId}] QR Code generation error:`, error);
      }
    });
    
    // Ready event
    client.on('ready', () => {
      console.log(`[${userId}] WhatsApp Web is ready!`);
      sessionStatuses.set(userId, 'connected');
      qrCodes.delete(userId); // Clear QR code after successful connection
    });
    
    // Authenticated event
    client.on('authenticated', () => {
      console.log(`[${userId}] Authentication successful`);
      sessionStatuses.set(userId, 'authenticated');
    });
    
    // Authentication failure event
    client.on('auth_failure', (message) => {
      console.error(`[${userId}] Authentication failed:`, message);
      sessionStatuses.set(userId, 'auth_failure');
      qrCodes.delete(userId);
    });
    
    // Disconnected event
    client.on('disconnected', (reason) => {
      console.log(`[${userId}] Client disconnected:`, reason);
      sessionStatuses.set(userId, 'disconnected');
      activeClients.delete(userId);
      qrCodes.delete(userId);
    });
    
    // Initialize client
    await client.initialize();
    
    // Wait a moment for QR code generation
    setTimeout(() => {
      const qrData = qrCodes.get(userId);
      if (qrData) {
        res.json({
          session_id: userId,
          status: 'waiting_for_scan',
          is_connected: false,
          qr: qrData.qr,
          expires_at: qrData.expires_at,
          message: 'QR kod oluşturuldu, WhatsApp uygulaması ile tarayın'
        });
      } else {
        res.json({
          session_id: userId,
          status: 'initializing',
          is_connected: false,
          message: 'Session başlatılıyor, QR kod oluşturuluyor...'
        });
      }
    }, 3000);
    
  } catch (error) {
    console.error(`[${userId}] Session initialization error:`, error);
    
    // Cleanup on error
    if (activeClients.has(userId)) {
      try {
        await activeClients.get(userId).destroy();
      } catch (destroyError) {
        console.error(`[${userId}] Error destroying client:`, destroyError);
      }
      activeClients.delete(userId);
    }
    qrCodes.delete(userId);
    sessionStatuses.delete(userId);
    
    res.status(500).json({
      error: 'Session initialization failed',
      message: error.message
    });
  }
});

// Check session status
app.post('/session-status', extractUserId, async (req, res) => {
  const userId = req.userId;
  
  try {
    const client = activeClients.get(userId);
    const status = sessionStatuses.get(userId) || 'no_session';
    const qrData = qrCodes.get(userId);
    
    if (!client) {
      return res.json({
        session_id: userId,
        status: 'no_session',
        is_connected: false,
        message: 'No active session found'
      });
    }
    
    // Check if client is actually ready
    const isReady = client.info && client.info.wid;
    
    if (isReady) {
      return res.json({
        session_id: userId,
        status: 'connected',
        is_connected: true,
        message: 'WhatsApp Web connected and ready',
        last_connected_at: new Date().toISOString(),
        phone_number: client.info.wid.user
      });
    } else if (qrData) {
      // Check if QR code is expired
      const isExpired = new Date() > new Date(qrData.expires_at);
      if (isExpired) {
        qrCodes.delete(userId);
        sessionStatuses.set(userId, 'expired');
        return res.json({
          session_id: userId,
          status: 'expired',
          is_connected: false,
          message: 'QR kod süresi doldu, yeniden oluşturun'
        });
      }
      
      return res.json({
        session_id: userId,
        status: 'waiting_for_scan',
        is_connected: false,
        qr: qrData.qr,
        expires_at: qrData.expires_at,
        message: 'QR kod tarama bekleniyor'
      });
    } else {
      return res.json({
        session_id: userId,
        status: status,
        is_connected: false,
        message: 'Session initializing'
      });
    }
    
  } catch (error) {
    console.error(`[${userId}] Session status check error:`, error);
    res.status(500).json({
      error: 'Status check failed',
      message: error.message
    });
  }
});

// Simulate QR scan (for testing purposes)
app.post('/simulate-scan', extractUserId, async (req, res) => {
  const userId = req.userId;
  
  try {
    // This is just a simulation for testing
    // Real scanning happens through the WhatsApp mobile app
    sessionStatuses.set(userId, 'connected');
    qrCodes.delete(userId);
    
    res.json({
      session_id: userId,
      status: 'connected',
      is_connected: true,
      last_connected_at: new Date().toISOString(),
      message: 'Test bağlantısı simüle edildi (gerçek kullanımda WhatsApp uygulaması ile tarayın)'
    });
    
  } catch (error) {
    console.error(`[${userId}] Simulation error:`, error);
    res.status(500).json({
      error: 'Simulation failed',
      message: error.message
    });
  }
});

// Disconnect session
app.post('/disconnect', extractUserId, async (req, res) => {
  const userId = req.userId;
  
  try {
    const client = activeClients.get(userId);
    
    if (client) {
      await client.logout();
      await client.destroy();
      activeClients.delete(userId);
    }
    
    qrCodes.delete(userId);
    sessionStatuses.delete(userId);
    
    console.log(`[${userId}] Session disconnected successfully`);
    
    res.json({
      session_id: userId,
      status: 'disconnected',
      is_connected: false,
      message: 'Session başarıyla kapatıldı'
    });
    
  } catch (error) {
    console.error(`[${userId}] Disconnect error:`, error);
    res.status(500).json({
      error: 'Disconnect failed',
      message: error.message
    });
  }
});

// Send message endpoint
app.post('/send-message', extractUserId, async (req, res) => {
  const userId = req.userId;
  const { phone, message } = req.body;
  
  try {
    const client = activeClients.get(userId);
    
    if (!client || !client.info) {
      return res.status(400).json({
        error: 'No active WhatsApp session'
      });
    }
    
    // Format phone number
    const chatId = `${phone}@c.us`;
    
    // Send message
    await client.sendMessage(chatId, message);
    
    res.json({
      success: true,
      message: 'Message sent successfully',
      to: phone,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`[${userId}] Send message error:`, error);
    res.status(500).json({
      error: 'Failed to send message',
      message: error.message
    });
  }
});

// Get all active sessions (admin endpoint)
app.get('/admin/sessions', (req, res) => {
  const sessions = [];
  
  for (const [userId, client] of activeClients.entries()) {
    const status = sessionStatuses.get(userId);
    const hasQR = qrCodes.has(userId);
    
    sessions.push({
      user_id: userId,
      status: status,
      has_qr: hasQR,
      is_connected: client.info && client.info.wid ? true : false,
      phone_number: client.info && client.info.wid ? client.info.wid.user : null
    });
  }
  
  res.json({
    total_sessions: sessions.length,
    sessions: sessions
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`WhatsApp Web Microservice running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  // Close all WhatsApp clients
  for (const [userId, client] of activeClients.entries()) {
    try {
      console.log(`Closing session for user ${userId}`);
      await client.destroy();
    } catch (error) {
      console.error(`Error closing session for ${userId}:`, error);
    }
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  
  // Close all WhatsApp clients
  for (const [userId, client] of activeClients.entries()) {
    try {
      console.log(`Closing session for user ${userId}`);
      await client.destroy();
    } catch (error) {
      console.error(`Error closing session for ${userId}:`, error);
    }
  }
  
  process.exit(0);
});