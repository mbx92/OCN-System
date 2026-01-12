# Progressive Web App (PWA)

OCN System sudah mendukung PWA dan dapat diinstall sebagai aplikasi standalone di berbagai devices.

## ✨ Fitur PWA

- ✅ **Installable** - Dapat diinstall di desktop dan mobile
- ✅ **Offline Ready** - Berfungsi tanpa koneksi internet (cache)
- ✅ **Fast Loading** - Pre-cache aset untuk loading cepat
- ✅ **App-like Experience** - Fullscreen tanpa browser chrome
- ✅ **Auto Update** - Update otomatis saat ada versi baru
- ✅ **Custom Icons** - Logo OCN sebagai app icon

## 📱 Cara Install di Mobile

### **Android (Chrome/Edge):**

1. Buka `http://your-server-ip:3000` di Chrome
2. Tap menu (⋮) → **"Install app"** atau **"Add to Home screen"**
3. Confirm install
4. Icon OCN akan muncul di home screen

### **iOS (Safari):**

1. Buka `http://your-server-ip:3000` di Safari
2. Tap tombol Share (□↑)
3. Scroll dan tap **"Add to Home Screen"**
4. Beri nama "OCN System"
5. Tap **"Add"**

## 💻 Cara Install di Desktop

### **Windows/macOS/Linux (Chrome/Edge):**

1. Buka `http://your-server-ip:3000`
2. Lihat icon **"+"** atau **"Install"** di address bar (kanan atas)
3. Klik **"Install"**
4. App akan terbuka di window terpisah

**Shortcut:** `Ctrl + Shift + I` (Windows/Linux) atau `⌘ + Shift + I` (macOS)

## 🎨 Icons yang Di-generate

| Size | Nama File | Penggunaan |
|------|-----------|------------|
| 192x192 | `icon-192x192.png` | Android home screen |
| 512x512 | `icon-512x512.png` | Android splash screen |
| 180x180 | `apple-touch-icon.png` | iOS home screen |
| 32x32 | `favicon-32x32.png` | Browser tab icon |
| 16x16 | `favicon.ico` | Browser fallback |

## 🔧 Regenerate Icons

Jika logo berubah:

```bash
# Generate ulang semua PWA icons
npm run generate:icons

# Rebuild dan deploy
docker-compose up -d --build
```

## ⚙️ Konfigurasi PWA

PWA dikonfigurasi di `nuxt.config.ts`:

```typescript
pwa: {
  manifest: {
    name: 'OCN System',
    short_name: 'OCN',
    theme_color: '#1e40af',
    background_color: '#ffffff',
  }
}
```

## 🌐 Manifest URL

PWA manifest tersedia di: `http://your-server:3000/manifest.webmanifest`

## 🔄 Service Worker

Service worker otomatis di-register untuk:
- Cache static assets (JS, CSS, images)
- Offline fallback
- Background sync (future)

## 📊 Testing PWA

### **Chrome DevTools:**

1. Buka DevTools (`F12`)
2. Tab **Application** → **Manifest**
3. Check semua icons dan metadata
4. Tab **Service Workers** → Verify registered

### **Lighthouse Audit:**

```bash
# Install Lighthouse
npm install -g lighthouse

# Run PWA audit
lighthouse http://your-server:3000 --view
```

Target Score: **90+** untuk PWA

## 🚀 Production Tips

### **HTTPS Required untuk PWA:**

PWA hanya berfungsi penuh di HTTPS (kecuali localhost). Setup reverse proxy dengan SSL:

```nginx
server {
    listen 443 ssl;
    server_name ocn.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
    }
}
```

### **Cache Strategy:**

- **Network First**: API calls (data selalu fresh)
- **Cache First**: Static assets (loading cepat)
- **Stale While Revalidate**: Images

## 📱 User Experience

Setelah install:

1. ✅ **Standalone Mode** - Tanpa browser UI
2. ✅ **Custom Icon** - Logo OCN di launcher
3. ✅ **Splash Screen** - Logo OCN saat loading
4. ✅ **Theme Color** - Blue (#1e40af) di status bar
5. ✅ **Offline Support** - Cached pages tetap accessible

## 🔍 Troubleshooting

### **PWA tidak muncul opsi install:**

- Pastikan akses via HTTPS (atau localhost)
- Clear browser cache dan reload
- Check console untuk error manifest
- Verify `manifest.webmanifest` load successfully

### **Icons tidak muncul:**

```bash
# Regenerate icons
npm run generate:icons

# Check icons ada di public/
ls -la public/*.png
```

### **Service worker error:**

```bash
# Clear service worker
# Chrome DevTools → Application → Service Workers → Unregister
# Lalu reload halaman
```

## 📚 Resources

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
