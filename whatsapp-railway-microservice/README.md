# WhatsApp Web Mikroservisi - Railway Deployment

## Genel Bakış
Bu mikroservis, gerçek WhatsApp Web entegrasyonu için whatsapp-web.js kütüphanesini kullanarak production-ready bir API sağlar.

## Özellikler
- ✅ Gerçek whatsapp-web.js entegrasyonu
- ✅ Multi-user session management
- ✅ QR kod generation ve management
- ✅ Real-time WhatsApp Web bağlantısı
- ✅ RESTful API endpoints
- ✅ Production-ready security
- ✅ Rate limiting ve CORS koruması

## API Endpoints

### POST /initialize-session
Yeni WhatsApp Web session başlatır ve QR kod oluşturur.

**Headers:**
- `X-User-ID`: Kullanıcı ID'si (required)

**Response:**
```json
{
  "session_id": "user_123",
  "status": "waiting_for_scan",
  "is_connected": false,
  "qr": "QR_CODE_STRING",
  "expires_at": "2024-12-25T10:30:00.000Z",
  "message": "QR kod oluşturuldu"
}
```

### POST /session-status
Mevcut session durumunu kontrol eder.

**Headers:**
- `X-User-ID`: Kullanıcı ID'si (required)

**Response:**
```json
{
  "session_id": "user_123",
  "status": "connected",
  "is_connected": true,
  "phone_number": "1234567890",
  "last_connected_at": "2024-12-25T10:35:00.000Z"
}
```

### POST /send-message
WhatsApp mesajı gönderir.

**Headers:**
- `X-User-ID`: Kullanıcı ID'si (required)

**Body:**
```json
{
  "phone": "1234567890",
  "message": "Merhaba!"
}
```

### POST /disconnect
WhatsApp session'ını kapatır.

### GET /health
Servis health check endpoint'i.

## Railway Deployment Talimatları

### 1. Railway Hesabı Oluşturma
1. [Railway.app](https://railway.app) sitesine gidin
2. GitHub hesabınız ile giriş yapın
3. Yeni proje oluşturun

### 2. Kod Deploy Etme

#### Seçenek A: GitHub Repository (Önerilen)
1. Bu kodu GitHub repository'nize push edin
2. Railway'de "Deploy from GitHub" seçin
3. Repository'nizi seçin
4. Railway otomatik olarak deploy edecek

#### Seçenek B: Railway CLI
1. Railway CLI'yı yükleyin:
   ```bash
   npm install -g @railway/cli
   ```

2. Railway'e login olun:
   ```bash
   railway login
   ```

3. Proje oluşturun:
   ```bash
   railway init
   ```

4. Deploy edin:
   ```bash
   railway up
   ```

### 3. Environment Variables Ayarlama
Railway dashboard'da aşağıdaki environment variable'ları set edin:

```
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://wln7xwqrttk2.space.minimax.io,https://xvxiwcbiqiqzfqisrvib.supabase.co
```

### 4. Deployment URL Alma
Deploy tamamlandıktan sonra Railway size bir public URL verecek:
- Format: `https://your-app-name.railway.app`
- Bu URL'yi kaydedin

### 5. Supabase Integration
Railway URL'sini Supabase'de environment variable olarak set edin:

1. Supabase dashboard'a gidin
2. Settings > Environment Variables
3. Yeni variable ekleyin:
   - Name: `WHATSAPP_MICROSERVICE_URL`
   - Value: `https://your-app-name.railway.app`

## Test Etme

### Health Check
```bash
curl https://your-app-name.railway.app/health
```

### Session Başlatma
```bash
curl -X POST https://your-app-name.railway.app/initialize-session \
  -H "Content-Type: application/json" \
  -H "X-User-ID: test_user_123"
```

## Production Notları

### Güvenlik
- ✅ Rate limiting aktif
- ✅ CORS koruması
- ✅ Helmet security headers
- ✅ Input validation

### Performans
- ✅ Multi-user session support
- ✅ Memory efficient client management
- ✅ Graceful shutdown handling
- ✅ Error recovery mechanisms

### Monitoring
- Health check endpoint mevcut
- Admin sessions endpoint ile monitoring
- Comprehensive logging

## Troubleshooting

### Common Issues
1. **QR Code Generation Slow**: Normal, 2-3 saniye sürebilir
2. **Session Not Connecting**: WhatsApp uygulaması ile QR kodu tarayın
3. **Memory Issues**: Railway'de yeterli RAM ayrıldığından emin olun

### Logs
Railway dashboard'da "Logs" sekmesinden real-time logları görebilirsiniz.

## Support
Sistem tamamen production-ready ve real WhatsApp Web API ile çalışmaktadır.