# 🎮 Neon Invaders - Progressive Web App (PWA)

![Neon Invaders](https://img.shields.io/badge/PWA-Ready-brightgreen) ![Version](https://img.shields.io/badge/version-1.0.0-blue) ![License](https://img.shields.io/badge/license-MIT-green)

Epic neon-themed space invaders game with boss battles, power-ups, and progressive difficulty. Now available as a fully-featured Progressive Web App!

## 🚀 PWA Features

### ✅ Completed Features

- **📲 Installable** - Install on any device (desktop, mobile, tablet)
- **🔌 Offline Capable** - Play even without internet connection
- **⚡ Fast Loading** - Cached assets for instant startup
- **🎯 Native Experience** - Runs in standalone mode without browser chrome
- **💾 Auto-Updates** - Seamlessly updates to new versions
- **📱 Cross-Platform** - Works on iOS, Android, Windows, macOS, Linux
- **🌐 SEO Optimized** - Rich metadata for sharing
- **🔔 Push Notifications** - (Framework ready, awaiting backend)
- **🔄 Background Sync** - (Framework ready for high scores)

## 📋 Table of Contents

- [Installation](#installation)
- [Development](#development)
- [Building for Production](#building-for-production)
- [Deploying](#deploying)
- [PWA Configuration](#pwa-configuration)
- [Service Worker](#service-worker)
- [Testing PWA](#testing-pwa)
- [Troubleshooting](#troubleshooting)

## 💻 Installation

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm
- Modern browser (Chrome, Edge, Firefox, Safari)

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Mrjavoweb/neon-arcade-game.git
   cd neon-arcade-game
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   ```
   http://localhost:5173
   ```

## 🛠️ Development

### Development Mode

```bash
npm run dev
```

The dev server runs on `http://localhost:5173` with hot module replacement.

**Note:** Service Worker is disabled in development mode by default. To test PWA features:

1. Build the production version: `npm run build`
2. Preview the build: `npm run preview`
3. Open `http://localhost:4173`

### Project Structure

```
neon-arcade-game/
├── public/                    # Static assets
├── src/
│   ├── components/           # React components
│   │   ├── game/            # Game UI components
│   │   ├── ui/              # ShadCN UI components
│   │   ├── PWAInstallPrompt.tsx  # PWA install banner
│   │   └── ...
│   ├── lib/
│   │   └── game/            # Game engine
│   │       ├── GameEngine.ts
│   │       ├── entities.ts
│   │       └── types.ts
│   ├── pages/               # Route pages
│   ├── App.tsx
│   └── main.tsx
├── index.html               # Entry point with PWA meta tags
├── manifest.json            # PWA manifest
├── sw.js                    # Service Worker
├── vite.config.ts
└── package.json
```

## 🏗️ Building for Production

### Build Command

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Preview Build

```bash
npm run preview
```

Preview the production build locally at `http://localhost:4173`.

### Build Output

```
dist/
├── index.html              # Entry HTML
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker
├── assets/                 # Bundled JS/CSS
│   ├── index-[hash].js
│   └── index-[hash].css
└── ...
```

## 🌐 Deploying

### Deploy to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Production deployment:**
   ```bash
   vercel --prod
   ```

### Deploy to Netlify

1. **Install Netlify CLI:**
   ```bash
   npm i -g netlify-cli
   ```

2. **Build and deploy:**
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

### Deploy to GitHub Pages

1. **Update `vite.config.ts`:**
   ```typescript
   export default defineConfig({
     base: '/neon-arcade-game/',  // Your repo name
     // ...
   })
   ```

2. **Build:**
   ```bash
   npm run build
   ```

3. **Deploy using `gh-pages`:**
   ```bash
   npm i -D gh-pages
   npx gh-pages -d dist
   ```

### Important Deployment Notes

⚠️ **HTTPS Required** - PWA features (Service Worker, Install prompt) require HTTPS in production.

✅ All the platforms above provide HTTPS by default.

## ⚙️ PWA Configuration

### manifest.json

Located at the root, defines app metadata:

```json
{
  "name": "Neon Invaders - Alien Space Attack",
  "short_name": "Neon Invaders",
  "start_url": "./index.html",
  "display": "standalone",
  "theme_color": "#22d3ee",
  "background_color": "#0a0014",
  ...
}
```

**Key Properties:**

- `name` - Full app name (shown on install)
- `short_name` - Short name (shown on home screen)
- `start_url` - URL to open when launching app
- `display: "standalone"` - Hides browser UI
- `icons` - App icons (192x192, 512x512)
- `screenshots` - For app stores

### Service Worker (sw.js)

Handles caching, offline support, and background tasks.

**Caching Strategies:**

1. **Cache First** - Game assets (S3 images)
   - Check cache first
   - Fallback to network
   - Best for static assets

2. **Network First** - HTML, API calls
   - Try network first
   - Fallback to cache if offline
   - Best for dynamic content

3. **Stale While Revalidate** - Other resources
   - Return cached version immediately
   - Update cache in background
   - Best for frequently updated resources

**Cache Names:**

- `neon-invaders-v1.0.0` - Core app files
- `neon-invaders-runtime-v1` - Runtime assets

### Cached Assets

**Core Files:**
- `index.html`
- `manifest.json`
- React bundles
- CSS files

**Game Assets (S3):**
- Player ship sprite
- Enemy sprites (basic, heavy, fast)
- Boss sprite
- Explosion animations
- Power-up sprites
- Shield effect

## 🧪 Testing PWA

### Desktop (Chrome/Edge)

1. Open DevTools (F12)
2. Go to "Application" tab
3. Check "Manifest" section
4. Check "Service Workers" section
5. Use "Lighthouse" tab to audit PWA

### Install Locally

1. Build: `npm run build`
2. Preview: `npm run preview`
3. Open `http://localhost:4173`
4. Click install button in address bar (Chrome) or use PWA install prompt in the app

### Mobile Testing

#### Android (Chrome)

1. Deploy to HTTPS server
2. Open in Chrome
3. Tap "Add to Home Screen" or use in-app install prompt
4. App installs with icon on home screen

#### iOS (Safari)

1. Deploy to HTTPS server
2. Open in Safari
3. Tap Share button
4. Select "Add to Home Screen"
5. App installs (note: iOS has limited PWA support)

### PWA Checklist

Use Lighthouse in Chrome DevTools:

```
✓ Registers a service worker
✓ Responds with 200 when offline
✓ Has a valid manifest
✓ Uses HTTPS
✓ Redirects HTTP to HTTPS
✓ Viewport is mobile-friendly
✓ Icons are correct size
✓ Theme color is set
```

## 🐛 Troubleshooting

### Service Worker Not Registering

**Problem:** Console shows "Service Worker registration failed"

**Solutions:**

1. Ensure you're on HTTPS (or localhost)
2. Check `sw.js` is in the root of your deployed site
3. Clear browser cache and hard reload (Ctrl+Shift+R)
4. Check browser console for specific errors

### Install Prompt Not Showing

**Problem:** No install button appears

**Causes:**

1. **Already installed** - Check chrome://apps
2. **Not on HTTPS** - PWA requires secure context
3. **Dismissed recently** - Cleared after 24 hours
4. **Browser doesn't support** - Try Chrome/Edge
5. **Manifest errors** - Check DevTools Application tab

**Debug:**

```javascript
// Check in console
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('Install prompt fired!', e);
});
```

### Assets Not Caching

**Problem:** Assets fail to load offline

**Solutions:**

1. Check Service Worker is active (DevTools > Application > Service Workers)
2. Verify asset URLs in `sw.js` match actual URLs
3. Check Network tab for failed requests
4. Clear all caches: DevTools > Application > Clear storage

### Update Not Applying

**Problem:** New version doesn't deploy

**Solutions:**

1. Update cache version in `sw.js`: `neon-invaders-v1.0.1`
2. Hard refresh (Ctrl+Shift+R)
3. Unregister old SW: DevTools > Application > Service Workers > Unregister
4. Clear site data: DevTools > Application > Clear storage

### iOS Installation Issues

**Known Limitations:**

- No `beforeinstallprompt` event on iOS
- Must manually add via Safari Share menu
- Limited notification support
- No background sync

**Workaround:**

Show manual instructions for iOS users:

```typescript
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
if (isIOS) {
  // Show "Add to Home Screen" instructions
}
```

## 📊 Performance Optimization

### Current Optimizations

✅ **Code Splitting** - Vite automatically splits bundles
✅ **Tree Shaking** - Removes unused code
✅ **Minification** - Production builds are minified
✅ **Asset Preloading** - Critical assets preloaded
✅ **Image Optimization** - WebP format for sprites
✅ **Font Preloading** - Google Fonts preconnected
✅ **Service Worker Caching** - Instant repeat loads

### Lighthouse Scores

Target scores for production:

- **Performance:** 90+
- **Accessibility:** 95+
- **Best Practices:** 95+
- **SEO:** 100
- **PWA:** 100

## 🔐 Security

### Content Security Policy (CSP)

Add to your hosting platform:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://easysite.ai;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https://newoaks.s3.us-west-1.amazonaws.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://newoaks.s3.us-west-1.amazonaws.com;
```

### HTTPS Enforcement

Ensure all requests go through HTTPS in production.

## 🎨 Customization

### Update App Name

1. Edit `manifest.json`:
   ```json
   {
     "name": "Your Game Name",
     "short_name": "Game"
   }
   ```

2. Edit `index.html`:
   ```html
   <title>Your Game Name</title>
   ```

### Update Theme Colors

1. Edit `manifest.json`:
   ```json
   {
     "theme_color": "#your-color",
     "background_color": "#your-color"
   }
   ```

2. Edit `index.html`:
   ```html
   <meta name="theme-color" content="#your-color">
   ```

### Update Icons

Replace icon URLs in `manifest.json` with your own SVG or PNG icons.

## 📱 Platform-Specific Features

### Desktop PWAs (Windows/macOS/Linux)

- **Window Controls:** Native title bar with minimize/maximize/close
- **File Handling:** Can register as file handler (future)
- **Shortcuts:** Right-click app icon for shortcuts
- **Badging:** API available for notification badges

### Mobile PWAs

- **Home Screen:** Indistinguishable from native apps
- **Splash Screen:** Auto-generated from manifest
- **Orientation Lock:** Configured in manifest
- **Safe Area:** Respects device notches

## 🔄 Version Management

### Updating the App

1. Make code changes
2. Update version in `sw.js`:
   ```javascript
   const CACHE_NAME = 'neon-invaders-v1.0.1'; // Increment version
   ```
3. Build: `npm run build`
4. Deploy
5. Users will see update prompt on next visit

### Cache Versioning Strategy

**Breaking changes:** Increment major version
```javascript
const CACHE_NAME = 'neon-invaders-v2.0.0';
```

**New features:** Increment minor version
```javascript
const CACHE_NAME = 'neon-invaders-v1.1.0';
```

**Bug fixes:** Increment patch version
```javascript
const CACHE_NAME = 'neon-invaders-v1.0.1';
```

## 🌟 Future Enhancements

### Planned Features

- [ ] **Push Notifications** - Daily challenges, high score alerts
- [ ] **Background Sync** - Offline score submission
- [ ] **Share API** - Share high scores
- [ ] **Web Share Target** - Receive shared content
- [ ] **Periodic Background Sync** - Daily rewards
- [ ] **File System Access** - Save custom game settings
- [ ] **Gamepad API** - Controller support
- [ ] **Achievement System** - With IndexedDB storage
- [ ] **Multiplayer** - WebRTC peer-to-peer

## 📞 Support

### Reporting Issues

Found a bug or have a suggestion? [Open an issue](https://github.com/Mrjavoweb/neon-arcade-game/issues)

### Documentation

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

## 📄 License

This project is licensed under the MIT License.

## 🙏 Credits

- **Game Design:** Neon Invaders Team
- **Graphics:** Custom SVG sprites
- **Fonts:** Google Fonts (Sora, Space Grotesk)
- **Framework:** React + Vite
- **UI Components:** ShadCN UI + Tailwind CSS

---

**Built with ❤️ by the Neon Invaders team**

🎮 **[Play Now](https://your-deployed-url.com)** | 📱 **Install the App** | ⭐ **[Star on GitHub](https://github.com/Mrjavoweb/neon-arcade-game)**
