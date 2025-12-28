# 🚀 Quick Start Guide - Neon Invaders PWA

## Installation & Running (2 minutes)

### 1️⃣ Install Dependencies

```bash
npm install
```

### 2️⃣ Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

⚠️ **Note:** Service Worker is disabled in dev mode. To test PWA features, use preview mode (step 3).

### 3️⃣ Test PWA Features (Production Preview)

```bash
# Build the app
npm run build

# Preview the production build
npm run preview
```

Open [http://localhost:4173](http://localhost:4173) and test:

- ✅ Install button in browser
- ✅ Offline mode (disconnect network in DevTools)
- ✅ Service Worker caching
- ✅ App install prompt

## 📱 Install as PWA

### Desktop (Chrome/Edge)
1. Click the install icon (⊕) in the address bar
2. Or click "Install Neon Invaders" in the app

### Android (Chrome)
1. Tap the "Add to Home Screen" prompt
2. Or use Menu → "Install app"

### iOS (Safari)
1. Tap the Share button
2. Select "Add to Home Screen"
3. Tap "Add"

## 🎮 Game Controls

### Desktop
- **Arrow Keys:** Move left/right
- **Space:** Fire
- **P:** Pause
- **M:** Menu

### Mobile
- **Touch & Drag:** Move ship
- **Tap Screen:** Fire
- **Auto-fire:** Enabled by default

## 🏗️ Building for Production

```bash
npm run build
```

Output in `dist/` folder ready to deploy!

## 🌐 Deploy

### Vercel (Recommended)
```bash
npm i -g vercel
vercel
```

### Netlify
```bash
npm i -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

### GitHub Pages
```bash
npm run build
npx gh-pages -d dist
```

## 🐛 Troubleshooting

**PWA install not showing?**
- Make sure you're using HTTPS or localhost
- Check DevTools → Application → Manifest
- Clear cache and reload (Ctrl+Shift+R)

**Service Worker not working?**
- Build for production: `npm run build`
- Use preview mode: `npm run preview`
- Check DevTools → Application → Service Workers

**Game assets not loading offline?**
- Wait for all assets to load once while online
- Check DevTools → Application → Cache Storage
- Should see `neon-invaders-v1.0.0` and `neon-invaders-runtime-v1`

## 📚 Full Documentation

See [PWA-README.md](./PWA-README.md) for complete documentation.

## ⚡ Quick Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run preview         # Preview production build
npm run lint            # Run linter

# Testing PWA
npm run preview:https   # Preview with HTTPS
npm run serve          # Serve on network (test on mobile)
```

## 🎯 What's Next?

1. ✅ Game is fully playable as PWA
2. ✅ Installable on all platforms
3. ✅ Offline capable
4. ✅ Auto-updates enabled

**Optional Enhancements:**
- Add push notifications (backend required)
- Implement high score leaderboard
- Add achievement system
- Enable background sync for scores

---

**Need help?** Check [PWA-README.md](./PWA-README.md) or [open an issue](https://github.com/Mrjavoweb/neon-arcade-game/issues)

**Ready to play?** 🎮 [Start the game!](http://localhost:5173)
