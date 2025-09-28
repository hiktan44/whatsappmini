# 🚀 Railway WhatsApp Mikroservisi - Hızlı Başlangıç

## 1-2-3 Deployment

### 1️⃣ Railway Setup (2 dakika)
```bash
# Railway'e git: https://railway.app
# GitHub ile login ol
# "New Project" > "Deploy from GitHub repo"
```

### 2️⃣ Environment Variables (1 dakika)
Railway dashboard'da Variables sekmesinde:
```
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://wln7xwqrttk2.space.minimax.io,https://xvxiwcbiqiqzfqisrvib.supabase.co
```

### 3️⃣ Supabase Integration (1 dakika)
```
1. Supabase Dashboard > Settings > Environment Variables
2. Add: WHATSAPP_MICROSERVICE_URL = https://YOUR-APP.up.railway.app
3. Edge Functions > whatsapp-production-service > Restart
```

## ✅ Test
```bash
curl https://YOUR-APP.up.railway.app/health
```

## 🎯 Kullanım
1. https://wln7xwqrttk2.space.minimax.io adresine git
2. Login: `aagfpszd@minimax.com` / `AE62C8M6Gg`
3. WhatsApp Web > QR Kod Oluştur
4. WhatsApp mobile app ile QR kodu tara
5. Gerçek WhatsApp bağlantısı kuruldu!

**Deployment süresi: ~5 dakika**
**Sonuç: Production-ready gerçek WhatsApp Web entegrasyonu** ⚡