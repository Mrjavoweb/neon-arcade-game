# 🎮 Alien Invasion Neon - Cheat Codes

Complete reference for all cheat codes available for testing and debugging.

---

## 🖥️ DESKTOP CHEAT CODES (Keyboard)

### Game Control
| Key | Action | Description |
|-----|--------|-------------|
| **P** | Pause/Resume | Toggle game pause state |

### Boss Level Shortcuts
| Key | Boss Level | Wave | Boss Details |
|-----|------------|------|--------------|
| **B** | Boss 1 | Wave 5 | Red boss • 60 HP • Baseline difficulty |
| **N** | Boss 2 | Wave 10 | Turquoise boss • 90 HP • 15% faster attacks • +0.8 projectile speed |
| **M** | Boss 3 | Wave 15 | Yellow boss • 126 HP • 28% faster attacks • +1.6 projectile speed |
| **,** (comma) | Boss 4 | Wave 20 | Purple boss • 168 HP • 39% faster attacks • +2.4 projectile speed |

### Wave Navigation
| Key | Action | Description |
|-----|--------|-------------|
| **+** or **=** | Skip ahead | Jump forward 5 waves |
| **-** or **_** | Go back | Jump backward 5 waves |

---

## 📱 MOBILE CHEAT CODES (Touch Gestures)

All mobile cheats require **triple-tapping** (3 rapid taps within 0.5 seconds) in specific screen corners.

### Screen Corners Layout
```
┌─────────────────────────┐
│ TOP-LEFT    TOP-RIGHT   │  ← Wave Navigation
│   (+5)        (-5)      │
│                         │
│                         │
│                         │
│                         │
│                         │
│ BTM-LEFT    BTM-RIGHT   │  ← Boss Shortcuts
│  (B1/B3)     (B2/B4)    │
└─────────────────────────┘
```

### Top Corners - Wave Navigation
| Corner | Taps | Action | Description |
|--------|------|--------|-------------|
| **Top-Left** | 3 taps | Skip ahead | Jump forward 5 waves |
| **Top-Right** | 3 taps | Go back | Jump backward 5 waves |

### Bottom Corners - Boss Level Shortcuts
| Corner | Taps | Boss Level | Wave | Boss Details |
|--------|------|------------|------|--------------|
| **Bottom-Left** | 3 taps | Boss 1 | Wave 5 | Red boss • 60 HP |
| **Bottom-Left** | 5 taps | Boss 3 | Wave 15 | Yellow boss • 126 HP |
| **Bottom-Right** | 3 taps | Boss 2 | Wave 10 | Turquoise boss • 90 HP |
| **Bottom-Right** | 5 taps | Boss 4 | Wave 20 | Purple boss • 168 HP |

### Corner Detection Zone
- Each corner is a **100px × 100px** invisible square
- Taps must be within 0.5 seconds of each other
- Console log confirms activation

---

## 🔍 Testing Boss Difficulty Scaling

### Quick Test Sequence (Desktop)
1. Start game
2. Press **B** → Test Boss 1 (Red, 60 HP)
3. Press **N** → Test Boss 2 (Turquoise, 90 HP, faster)
4. Press **M** → Test Boss 3 (Yellow, 126 HP, much faster)
5. Press **,** → Test Boss 4 (Purple, 168 HP, fastest)

### Quick Test Sequence (Mobile)
1. Start game
2. Triple-tap **bottom-left** → Boss 1 (Red)
3. Triple-tap **bottom-right** → Boss 2 (Turquoise)
4. Tap **bottom-left** 5 times → Boss 3 (Yellow)
5. Tap **bottom-right** 5 times → Boss 4 (Purple)

---

## 📊 Boss Difficulty Comparison

| Boss | Wave | HP | Health vs Base | Attack Speed | Projectile Speed | Movement Speed | Points |
|------|------|----|--------------:|--------------|------------------|----------------|--------|
| Boss 1 (Red) | 5 | 60 | 100% | 100% | +0.0 | 2.0 | 500 |
| Boss 2 (Turquoise) | 10 | 90 | +50% | 85% (-15%) | +0.8 | 2.3 (+15%) | 750 |
| Boss 3 (Yellow) | 15 | 126 | +110% | 72% (-28%) | +1.6 | 2.6 (+30%) | 1000 |
| Boss 4 (Purple) | 20 | 168 | +180% | 61% (-39%) | +2.4 | 2.9 (+45%) | 1250 |

**Note:** Lower attack speed % = faster attacks (reduced delay between shots)

---

## 🛠️ Developer Notes

### Console Logging
All cheat activations log to the browser console:
- Desktop: `🎮 CHEAT: [Action description]`
- Mobile: `🎮 MOBILE CHEAT: [Action description]`

### Verification
1. Open browser DevTools (F12)
2. Go to Console tab
3. Activate any cheat
4. Confirm console message appears

### Mobile Testing Tips
- Use browser's responsive design mode to test mobile cheats
- Corners work in both portrait and landscape orientations
- Pause button position adjusts automatically

---

## ⚠️ Important Notes

1. **Game Must Be Playing**: Most cheats only work when `state === 'playing'`
2. **Wave Limits**: Skip ahead capped at wave 95
3. **Boss Spawning**: Boss shortcuts use `nextWave()` to properly initialize bosses
4. **Difficulty Scaling**: All bosses scale correctly with their respective wave numbers
5. **Transparent Backgrounds**: All 4 boss images now have transparent backgrounds

---

## 🎯 Purpose

These cheat codes are designed for:
- ✅ Testing boss difficulty scaling
- ✅ Verifying boss image transparency
- ✅ Debugging phase transitions
- ✅ Rapid QA testing
- ✅ Gameplay balance verification
- ✅ Mobile UI/UX testing

**Not intended for production gameplay** - Remove or disable before final release if needed.

---

Generated for Alien Invasion Neon PWA Game
Last Updated: 2025-12-30
