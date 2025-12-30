# 🔥 Combo System Explained

## What is a Combo?

A **combo** is a **kill streak** - the number of enemies you destroy in rapid succession without letting too much time pass between kills.

---

## How Combos Work

### ⏱️ **Combo Timer: 2 Seconds**
- You have **2 seconds** (`comboTimeout = 2000ms`) between kills to maintain your combo
- Each kill resets the 2-second timer
- If 2 seconds pass without a kill → combo resets to 0

### 📈 **How to Build Combos**

**Step-by-Step:**
1. Kill an enemy → Combo = 1
2. Kill another enemy within 2 seconds → Combo = 2
3. Keep killing enemies quickly → Combo = 3, 4, 5...
4. Wait too long (>2 seconds) → Combo resets to 0
5. Start over!

**Example Timeline:**
```
00:00 - Kill enemy 1 → COMBO 1x
00:01 - Kill enemy 2 → COMBO 2x (within 2s ✓)
00:01.5 - Kill enemy 3 → COMBO 3x (within 2s ✓)
00:04 - No kill for 2+ seconds → COMBO RESET (0x)
00:05 - Kill enemy 4 → COMBO 1x (starting fresh)
```

---

## 🎯 Combo Milestones & Rewards

The game gives you **bonus score** and **visual celebrations** at these milestones:

| Combo | Notification | Bonus Score | Life Reward | Visual Effect | Color |
|-------|-------------|-------------|-------------|---------------|-------|
| **5x** | "NICE! x5" | +50 points | - | Small notification | Cyan (#22d3ee) |
| **10x** | "GREAT! x10" | +100 points | - | Screen shake (10) | Yellow (#fbbf24) |
| **15x** | "EPIC! x15" | **+500 points** | **+1 Life** 🎁 | Screen shake (25) | Orange (#ff6600) |
| **20x** | "AMAZING! x20" | +250 points | - | Screen shake (15) | Pink (#ec4899) |
| **30x** | "INSANE! x30" | **+1000 points** | **+1 Life** 🎁 | Screen shake (28) | Purple (#a855f7) |
| **50x** | "LEGENDARY! x50" | **+2000 points** | **+1 Life** 🎁 | Screen shake (30) | Magenta (#ff00ff) |
| **75x+** | "UNSTOPPABLE! x75" | +1000 points | - | Screen shake (25) | Orange (#ff6600) |

**🎁 Life Rewards (One-Time Per Game):**
- **15x Combo** = +1 Life + 500 score (achievable in early waves!)
- **30x Combo** = +1 Life + 1000 score (mid-game milestone)
- **50x Combo** = +1 Life + 2000 score (legendary achievement!)
- **Potential Total** = +3 lives if you hit all milestones!

**💡 Pro Tip:** Combos now persist across wave transitions! The 2-second timer doesn't count during the brief pause between waves, making these milestones much more achievable.

*Every 25 kills after 50 (75, 100, 125...) gives +1000 bonus points (no additional lives)*

---

## 📊 How Combos are Earned

### **Every Kill Counts:**
- ✅ Basic enemy kill → +1 combo
- ✅ Fast enemy kill → +1 combo
- ✅ Heavy enemy kill → +1 combo
- ✅ Boss minion kill → +1 combo
- ✅ Boss kill → +1 combo

**All enemy types count equally toward combo!**

### **Location in Code:**
Every kill calls `registerKill(points)` which:
1. Checks if 3 seconds have passed since last kill
2. If yes → reset combo to 0
3. If no → increment combo by 1
4. Track max combo (highest combo this session)
5. Check for milestone rewards

---

## 💔 How Combos are Lost

### **2 Ways to Lose Your Combo:**

1. **⏱️ Timeout (2 seconds)**
   - Don't kill anything for 2+ seconds
   - Combo automatically resets to 0
   - Most common way to lose combo

2. **💥 Taking Damage**
   - Getting hit by enemy bullet → Combo = 0
   - Getting hit by boss attack → Combo = 0
   - Collision with enemy → Combo = 0
   - **Taking damage immediately resets combo!**

---

## 📍 Visual Feedback

### **Combo Counter Display:**
- Shows **"COMBO Xx"** at top-center of screen
- Only appears when combo ≥ 3
- Color changes based on combo size:
  - Yellow (default): 3-9 combo
  - Yellow: 10-19 combo
  - Pink: 20-49 combo
  - Purple: 50+ combo (legendary!)

### **Pulse Animation:**
- Counter pulses/scales slightly
- Creates excitement and draws attention
- Pulse speed increases with combo size

### **Combo Notifications:**
- Large text appears at milestones
- Fades out over 2 seconds
- Grows slightly during animation
- Positioned at top-center of screen

---

## 🎮 Strategy Tips

### **How to Build High Combos:**

1. **Target Dense Enemy Clusters**
   - Multiple enemies close together
   - Kill them quickly in succession

2. **Use Power-Ups**
   - **Rapid Fire** → Faster kills
   - **Plasma** → Piercing shots for multiple kills
   - **Slow-Mo** → More time to aim between kills

3. **Plan Your Shots**
   - Don't wait for perfect aim
   - Keep shooting to maintain momentum
   - 2 seconds goes fast!

4. **Prioritize Close Enemies**
   - Easier to hit quickly
   - Less travel time for bullets
   - Maintain combo flow

5. **Avoid Damage**
   - Getting hit resets combo
   - Dodge while maintaining offense
   - Use shield power-up for protection

### **Best Times for Combos:**

- ✅ **Early waves** (many weak enemies clustered)
- ✅ **Boss minion spawns** (multiple targets)
- ✅ **With rapid fire power-up** (kill faster)
- ❌ **Boss fights alone** (only 1 target = hard to combo)
- ❌ **Late waves** (enemies spread out)

---

## 📈 Combo Statistics Tracked

### **Two Stats:**
1. **Current Combo** (`stats.combo`)
   - Active combo count
   - Resets on timeout or damage
   - Displayed on HUD

2. **Max Combo** (`stats.maxCombo`)
   - Highest combo this game session
   - Never resets until game over
   - Shown on game over screen

---

## 💡 Implemented & Potential Improvements

### **✅ Life Rewards for Combos (IMPLEMENTED):**
- **15 combo** → +1 life + 500 score (one-time per game)
- **30 combo** → +1 life + 1000 score (one-time per game)
- **50 combo** → +1 life + 2000 score (one-time per game)
- These rewards permanently increase max health for the session!
- **Wave transitions don't break combos** - The 2-second timer pauses between waves!

### **Combo Multipliers (Not Implemented):**
- 5x combo → 1.5x score multiplier
- 10x combo → 2x score multiplier
- 20x combo → 3x score multiplier
- 50x combo → 5x score multiplier

### **Combo Power-Up Drops:**
- High combos (20+) have chance to spawn power-up
- Legendary combos (50+) guarantee rare power-up

### **Combo Time Extension:**
- First 10 kills: 3 seconds
- 10-20 kills: 4 seconds
- 20+ kills: 5 seconds
- Makes it easier to sustain high combos

---

## 🔧 Technical Details

### **Code Location:**
- **registerKill()** - Line 1251 in GameEngine.ts
- **Combo timeout check** - Lines 1254-1257, 1574-1578
- **Combo reset on damage** - Line 1376
- **Combo display** - Lines 1693-1732

### **Constants:**
```typescript
comboTimeout: 2000 // 2 seconds between kills
```

### **Milestone Thresholds:**
```typescript
5   → "NICE! x5"         +50 points
10  → "GREAT! x10"       +100 points
15  → "EPIC! x15"        +500 points + 1 LIFE (once)
20  → "AMAZING! x20"     +250 points
30  → "INSANE! x30"      +1000 points + 1 LIFE (once)
50  → "LEGENDARY! x50"   +2000 points + 1 LIFE (once)
75+ → "UNSTOPPABLE!"     +1000 points (every 25)
```

---

## ❓ FAQ

**Q: Does combo affect XP?**
A: No, combos give bonus score points and life rewards (at 15x, 30x, 50x), but not XP.

**Q: Can I get multiple life rewards in one game?**
A: Yes! Each combo milestone (15x, 30x, 50x) can be earned once per session. If you're skilled enough to hit all three, you earn +3 lives total!

**Q: Do wave transitions reset my combo?**
A: No! The 2-second combo timer pauses during wave transitions. You can maintain your combo across multiple waves as long as you keep killing enemies within 2 seconds of each other.

**Q: Do bosses count toward combo?**
A: Yes! Boss kills count as +1 combo.

**Q: Can I see my max combo anywhere?**
A: Yes, on the game over screen under stats.

**Q: Is 2 seconds too short?**
A: It's designed to reward fast, aggressive play. Can be adjusted if too difficult.

**Q: Do power-up collections count toward combo?**
A: No, only enemy kills count.

**Q: What's the world record combo?**
A: No tracking yet - depends on player skill and wave density!

---

## 🎯 Summary

**Combo System = Kill Streak with 2-Second Window**

- Build combos by killing enemies quickly (within 2 seconds)
- Earn bonus score at milestones (5x, 10x, 20x, 50x, 75x+)
- Lose combo by taking damage or waiting too long
- Displayed as "COMBO Xx" at top-center when ≥ 3
- Encourages fast, aggressive gameplay
- Rewards skill and consistency

**Current Timeout: 2 seconds** (can be adjusted if needed)

---

*Want to change the combo timeout or add combo-based life rewards? Let me know!*

Last Updated: 2025-12-30
