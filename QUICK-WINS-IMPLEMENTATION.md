# 🎯 Quick Wins Gamification - Implementation Plan

**Priority:** High
**Complexity:** Low-Medium
**Expected Impact:** High player retention and engagement

---

## 📋 Overview

Implementing three "Quick Wins" gamification features to improve player engagement and reward progression:

1. **Wave Milestone Rewards** - Extra lives at wave milestones
2. **100 Combo Life Reward** - Bonus life for hitting 100x combo
3. **Daily Login Rewards** - Progressive rewards for consecutive days

---

## 1️⃣ Wave Milestone Rewards

### **Concept**
Players earn **+1 extra life** when completing milestone waves (every 10 waves).

### **Milestone Schedule**
| Wave | Reward | Notification |
|------|--------|--------------|
| **10** | +1 Life | "WAVE 10 COMPLETE! +1 Life Bonus!" |
| **20** | +1 Life | "WAVE 20 COMPLETE! +1 Life Bonus!" |
| **30** | +1 Life | "WAVE 30 COMPLETE! +1 Life Bonus!" |
| **40** | +1 Life | "WAVE 40 COMPLETE! +1 Life Bonus!" |
| **50** | +1 Life | "WAVE 50 COMPLETE! +1 Life Bonus!" |
| **Every 10** | +1 Life | "WAVE X COMPLETE! +1 Life Bonus!" |

### **Implementation Details**

**Where to Add:**
- `GameEngine.ts` - `nextWave()` function (around line 744)

**Logic:**
```typescript
nextWave() {
  this.stats.wave++;

  // Wave Milestone Reward - every 10 waves
  if (this.stats.wave % 10 === 0) {
    // Award +1 life (respecting max health cap)
    if (this.stats.lives < this.stats.maxHealth) {
      this.stats.lives++;

      // Show celebration notification
      this.addComboNotification(
        `WAVE ${this.stats.wave} COMPLETE!\n+1 Life Bonus!`,
        '#00ff00',
        2.0
      );

      // Screen shake for excitement
      this.screenShake = { x: 0, y: 0, intensity: 20 };
    }
  }

  // Rest of wave logic...
}
```

**Visual Feedback:**
- Large green notification: "WAVE 10 COMPLETE! +1 Life Bonus!"
- Screen shake (intensity: 20)
- Health indicator pulses/glows when life is added

**Edge Cases:**
- If player is already at max health → still show notification but say "MAX HEALTH!"
- Life reward applies immediately (heals player if damaged)

---

## 2️⃣ Combo Life Rewards

### **Concept**
Players earn **+1 extra life** when achieving milestone combos: **15x**, **30x**, and **50x** (each once per game session).

### **Why These Numbers?**
- **15x Combo** = Achievable in early waves (Wave 2-3) with focused play
- **30x Combo** = Mid-game milestone (Wave 4-6) with good skill
- **50x Combo** = Late-game achievement (Wave 8+) for skilled players
- With 2-second timeout, these are challenging but realistic

### **Reward Details**
| Combo | Reward | Score Bonus | Notification | One-Time? |
|-------|--------|-------------|--------------|-----------|
| **15x** | +1 Life | +500 points | "EPIC 15 COMBO!\n+1 LIFE REWARD!" | ✅ Yes (once per game) |
| **30x** | +1 Life | +1000 points | "INSANE 30 COMBO!\n+1 LIFE REWARD!" | ✅ Yes (once per game) |
| **50x** | +1 Life | +2000 points | "LEGENDARY 50 COMBO!\n+1 LIFE REWARD!" | ✅ Yes (once per game) |

### **Implementation Details**

**Where to Add:**
- `GameEngine.ts` - `registerKill()` function (around line 1251)

**Logic:**
```typescript
// Add new properties to GameEngine class
private has15ComboReward: boolean = false;
private has30ComboReward: boolean = false;
private has50ComboReward: boolean = false;

registerKill(points: number) {
  const now = Date.now();

  // Reset combo if too much time has passed
  if (now - this.lastKillTime > this.comboTimeout) {
    this.stats.combo = 0;
  }

  this.lastKillTime = now;
  this.stats.combo++;

  if (this.stats.combo > this.stats.maxCombo) {
    this.stats.maxCombo = this.stats.combo;
  }

  // 15 Combo Life Reward (one-time per game)
  if (this.stats.combo === 15 && !this.has15ComboReward) {
    this.has15ComboReward = true;

    // Award +1 life (can exceed max health!)
    this.stats.lives++;
    this.stats.maxHealth = Math.max(this.stats.maxHealth, this.stats.lives);

    // Celebration
    this.addComboNotification(
      'EPIC 15 COMBO!\n+1 LIFE REWARD!',
      '#ff6600', // Orange
      2.0
    );

    this.screenShake = { x: 0, y: 0, intensity: 25 };
    this.stats.score += 500;
  }

  // 30 Combo Life Reward (one-time per game)
  if (this.stats.combo === 30 && !this.has30ComboReward) {
    this.has30ComboReward = true;

    // Award +1 life (can exceed max health!)
    this.stats.lives++;
    this.stats.maxHealth = Math.max(this.stats.maxHealth, this.stats.lives);

    // Epic celebration
    this.addComboNotification(
      'INSANE 30 COMBO!\n+1 LIFE REWARD!',
      '#a855f7', // Purple
      2.3
    );

    this.screenShake = { x: 0, y: 0, intensity: 28 };
    this.stats.score += 1000;
  }

  // 50 Combo Life Reward (one-time per game)
  if (this.stats.combo === 50 && !this.has50ComboReward) {
    this.has50ComboReward = true;

    // Award +1 life (can exceed max health for legendary achievement!)
    this.stats.lives++;
    this.stats.maxHealth = Math.max(this.stats.maxHealth, this.stats.lives);

    // Legendary celebration
    this.addComboNotification(
      'LEGENDARY 50 COMBO!\n+1 LIFE REWARD!',
      '#ff00ff', // Magenta for legendary
      2.5
    );

    this.screenShake = { x: 0, y: 0, intensity: 30 };
    this.stats.score += 2000;
  }

  // Existing milestone rewards (5x, 10x, 20x)...
}
```

**Fix Wave Transition Combo Reset:**
```typescript
// In nextWave() function - DON'T reset combo timer during wave transitions
nextWave() {
  this.stats.wave++;

  // IMPORTANT: Don't reset lastKillTime during wave transitions
  // This allows combos to carry over between waves
  // The 2-second timeout still applies, but wave transitions don't count against it

  // Wave Milestone Reward logic...
  // Enemy spawning logic...
}
```

**Reset Logic:**
```typescript
reset() {
  // Reset combo reward flags when game restarts
  this.has15ComboReward = false;
  this.has30ComboReward = false;
  this.has50ComboReward = false;

  // Rest of reset logic...
}
```

**Visual Feedback:**

**15 Combo:**
- Orange notification: "EPIC 15 COMBO! +1 LIFE REWARD!"
- Screen shake (intensity: 25)
- +500 bonus score
- Health indicator expands to show new max health

**30 Combo:**
- Purple notification: "INSANE 30 COMBO! +1 LIFE REWARD!"
- Stronger screen shake (intensity: 28)
- +1000 bonus score
- Health indicator expands to show new max health

**50 Combo:**
- Magenta notification: "LEGENDARY 50 COMBO! +1 LIFE REWARD!"
- Intense screen shake (intensity: 30)
- +2000 bonus score
- Health indicator expands to show new max health

**Special Features:**
- All combo rewards **can exceed max health** (e.g., max health = 5, get reward → max health becomes 6)
- Each reward only available once per game session
- Multiple rewards can be earned in one session (15, 30, and 50 = +3 total lives!)
- **Combos persist across wave transitions** - No penalty for waves ending!

---

## 3️⃣ Daily Login Rewards

### **Concept**
Players earn progressive rewards for logging in on **consecutive days**.

### **Reward Schedule**

| Day | Reward | Description |
|-----|--------|-------------|
| **Day 1** | 500 Bonus Score | "Welcome Back! +500 Points" |
| **Day 2** | 1000 Bonus Score | "Day 2 Streak! +1000 Points" |
| **Day 3** | +1 Starting Life | "Day 3 Streak! Start with 4 Lives Today!" |
| **Day 4** | 1500 Bonus Score | "Day 4 Streak! +1500 Points" |
| **Day 5** | 2000 Bonus Score | "Day 5 Streak! +2000 Points" |
| **Day 6** | 2500 Bonus Score | "Day 6 Streak! +2500 Points" |
| **Day 7** | +1 Starting Life + 5000 Score | "🎉 WEEK STREAK! +1 Life & +5000 Points!" |
| **Day 8-13** | 1000 Score Daily | Continues cycling |
| **Day 14** | +1 Starting Life + 7500 Score | "🏆 2 WEEK STREAK! +1 Life & +7500 Points!" |
| **Day 21** | +1 Starting Life + 10000 Score | "👑 3 WEEK STREAK! +1 Life & +10k Points!" |
| **Day 30** | +2 Starting Lives + 20000 Score | "🌟 MONTH STREAK! +2 Lives & +20k Points!" |

### **Reward Types**

1. **Daily Bonus Score** (Every day)
   - Immediately added to score at game start
   - Helps players achieve higher scores

2. **Starting Life Bonus** (Days 3, 7, 14, 21, 30)
   - Start with 4 lives instead of 3 (Day 3)
   - Start with 5 lives (Day 7)
   - Start with 6 lives (Day 14)
   - Resets each game session (not permanent)

3. **Streak Milestones** (Weekly/Monthly)
   - Week 1 (Day 7): +1 life + 5k score
   - Week 2 (Day 14): +1 life + 7.5k score
   - Week 3 (Day 21): +1 life + 10k score
   - Month (Day 30): +2 lives + 20k score

### **Implementation Requirements**

**Storage Solution:**
Use browser `localStorage` to persist daily login data:

```typescript
interface DailyLoginData {
  lastLoginDate: string; // ISO date string (YYYY-MM-DD)
  currentStreak: number; // Consecutive days
  longestStreak: number; // All-time record
  totalLogins: number; // Total login count
  rewardsClaimed: boolean; // Today's reward claimed?
}
```

**New Service File:** `src/lib/services/dailyRewards.ts`

```typescript
export class DailyRewardService {
  private static STORAGE_KEY = 'alienInvasion_dailyLogin';

  static getLoginData(): DailyLoginData {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) {
      return {
        lastLoginDate: '',
        currentStreak: 0,
        longestStreak: 0,
        totalLogins: 0,
        rewardsClaimed: false
      };
    }
    return JSON.parse(stored);
  }

  static saveLoginData(data: DailyLoginData): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  static checkDailyLogin(): {
    isNewDay: boolean;
    streak: number;
    reward: { score: number; lives: number; message: string };
  } {
    const data = this.getLoginData();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const lastLogin = data.lastLoginDate;

    // Check if already claimed today
    if (lastLogin === today && data.rewardsClaimed) {
      return {
        isNewDay: false,
        streak: data.currentStreak,
        reward: { score: 0, lives: 0, message: '' }
      };
    }

    // Check if new day
    const isNewDay = lastLogin !== today;
    if (!isNewDay) {
      return {
        isNewDay: false,
        streak: data.currentStreak,
        reward: { score: 0, lives: 0, message: '' }
      };
    }

    // Check if streak continues (yesterday's date)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const streakContinues = lastLogin === yesterdayStr;
    const newStreak = streakContinues ? data.currentStreak + 1 : 1;

    // Calculate reward based on streak
    const reward = this.calculateReward(newStreak);

    // Update data
    const newData: DailyLoginData = {
      lastLoginDate: today,
      currentStreak: newStreak,
      longestStreak: Math.max(data.longestStreak, newStreak),
      totalLogins: data.totalLogins + 1,
      rewardsClaimed: true
    };
    this.saveLoginData(newData);

    return {
      isNewDay: true,
      streak: newStreak,
      reward
    };
  }

  private static calculateReward(day: number): {
    score: number;
    lives: number;
    message: string;
  } {
    // Day 30+ (Monthly milestone)
    if (day >= 30 && day % 30 === 0) {
      return {
        score: 20000,
        lives: 2,
        message: `🌟 ${day} DAY STREAK!\n+2 Lives & +20k Points!`
      };
    }

    // Day 21+ (3 weeks)
    if (day >= 21 && day % 7 === 0) {
      return {
        score: 10000,
        lives: 1,
        message: `👑 ${day} DAY STREAK!\n+1 Life & +10k Points!`
      };
    }

    // Day 14+ (2 weeks)
    if (day >= 14 && day % 7 === 0) {
      return {
        score: 7500,
        lives: 1,
        message: `🏆 ${day} DAY STREAK!\n+1 Life & +7.5k Points!`
      };
    }

    // Day 7+ (Weekly milestone)
    if (day >= 7 && day % 7 === 0) {
      return {
        score: 5000,
        lives: 1,
        message: `🎉 WEEK STREAK!\n+1 Life & +5k Points!`
      };
    }

    // Day 3 (First life bonus)
    if (day === 3) {
      return {
        score: 0,
        lives: 1,
        message: 'Day 3 Streak!\nStart with +1 Life!'
      };
    }

    // Regular days
    const scoreRewards: Record<number, number> = {
      1: 500,
      2: 1000,
      4: 1500,
      5: 2000,
      6: 2500
    };

    const score = scoreRewards[day] || 1000; // Default 1000 for days 8+

    return {
      score,
      lives: 0,
      message: `Day ${day} Streak!\n+${score} Points!`
    };
  }

  static resetStreak(): void {
    const data = this.getLoginData();
    data.currentStreak = 0;
    data.rewardsClaimed = false;
    this.saveLoginData(data);
  }
}
```

**Integration with GameEngine:**

```typescript
// In GameEngine constructor
constructor(canvas: HTMLCanvasElement, isMobile: boolean = false) {
  // Check daily login on game start
  const loginCheck = DailyRewardService.checkDailyLogin();

  if (loginCheck.isNewDay && loginCheck.reward.score > 0) {
    // Apply rewards
    this.stats.score += loginCheck.reward.score;
    this.stats.lives += loginCheck.reward.lives;
    this.stats.maxHealth = Math.max(this.stats.maxHealth, this.stats.lives);

    // Show reward notification
    setTimeout(() => {
      this.addComboNotification(
        loginCheck.reward.message,
        '#ffd700', // Gold color
        2.0
      );
    }, 2000); // Delay 2s so player sees it after game starts
  }

  // Rest of constructor...
}
```

**UI Component:** `src/components/game/DailyRewardModal.tsx`

```typescript
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface DailyRewardModalProps {
  show: boolean;
  streak: number;
  reward: {
    score: number;
    lives: number;
    message: string;
  };
  onClose: () => void;
}

export default function DailyRewardModal({ show, streak, reward, onClose }: DailyRewardModalProps) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!show) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}>

          <motion.div
            className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-4 border-yellow-400 rounded-2xl p-8 max-w-md w-full mx-4"
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0.5, rotate: 10 }}
            transition={{ type: 'spring', duration: 0.5 }}>

            <div className="text-center space-y-4">
              <motion.h2
                className="text-4xl font-black text-yellow-400 font-['Sora']"
                style={{ textShadow: '0 0 20px rgba(251, 191, 36, 0.8)' }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}>
                DAILY REWARD!
              </motion.h2>

              <div className="text-6xl">🎁</div>

              <div className="text-cyan-400 text-xl font-bold">
                {streak} Day Streak!
              </div>

              <div className="bg-black/60 rounded-lg p-4 border-2 border-cyan-400/40">
                <div className="text-white text-2xl font-bold whitespace-pre-line">
                  {reward.message}
                </div>
              </div>

              {reward.score > 0 && (
                <div className="text-green-400 text-lg font-bold">
                  +{reward.score.toLocaleString()} Bonus Score
                </div>
              )}

              {reward.lives > 0 && (
                <div className="text-red-400 text-lg font-bold">
                  +{reward.lives} Starting {reward.lives === 1 ? 'Life' : 'Lives'}
                </div>
              )}

              <div className="text-gray-400 text-sm mt-4">
                Auto-closing in {countdown}s...
              </div>

              <button
                onClick={onClose}
                className="w-full mt-4 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition-all">
                START GAME
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## 🎨 Visual Design

### **Color Scheme for Rewards**
| Reward Type | Color | Effect |
|-------------|-------|--------|
| Wave Milestone | Green (#00ff00) | Life gain |
| 100 Combo | Magenta (#ff00ff) | Legendary achievement |
| Daily Login | Gold (#ffd700) | Daily bonus |

### **Animation Hierarchy**
1. **Screen Shake** - Intensity based on reward significance
2. **Notification** - Large animated text with glow
3. **UI Updates** - Health bar pulses, score counter animates
4. **Sound Effects** - (Future) Celebratory sound cues

---

## 📊 Tracking & Analytics

### **New Stats to Track**
Add to `GameStats` interface in `types.ts`:

```typescript
export interface GameStats {
  // Existing stats...

  // New gamification stats
  waveMilestonesReached: number; // Count of 10-wave milestones
  has100ComboReward: boolean; // 100 combo reward claimed this session
  dailyLoginStreak: number; // Current login streak
  totalLifeRewards: number; // Total lives earned from rewards
}
```

---

## ⚠️ Edge Cases & Balancing

### **Wave Milestone Rewards**
- ✅ Award life even if at max health → increases max health
- ✅ Show notification regardless of health status
- ✅ Can be earned multiple times per session (every 10 waves)

### **100 Combo Reward**
- ✅ Only once per game session
- ✅ Can exceed max health (permanent boost)
- ✅ Reset flag on game restart
- ❌ Cannot be earned again even if combo continues

### **Daily Login Rewards**
- ✅ Streak resets if player skips a day
- ✅ Rewards claimed only once per calendar day
- ✅ Persists across browser sessions (localStorage)
- ❌ Changing system clock won't trick system (uses server time if available)

---

## 🚀 Implementation Priority

### **Phase 1: Wave Milestones** (30 minutes)
1. Add logic to `nextWave()`
2. Test milestone notifications
3. Verify life rewards work correctly

### **Phase 2: 100 Combo Reward** (30 minutes)
1. Add `has100ComboReward` flag
2. Update `registerKill()`
3. Test combo reward triggers
4. Add reset logic

### **Phase 3: Daily Login System** (2 hours)
1. Create `DailyRewardService.ts`
2. Build `DailyRewardModal.tsx`
3. Integrate with `GameEngine`
4. Test localStorage persistence
5. Test streak calculation logic

**Total Estimated Time:** 3 hours

---

## 🧪 Testing Checklist

### **Wave Milestones**
- [ ] Test wave 10 reward triggers
- [ ] Test wave 20 reward triggers
- [ ] Test wave 100 reward (10th milestone)
- [ ] Verify life added correctly
- [ ] Verify notification appears
- [ ] Test when already at max health

### **100 Combo Reward**
- [ ] Build combo to exactly 100
- [ ] Verify life awarded
- [ ] Verify one-time only (combo 101, 102 don't trigger)
- [ ] Verify reset works on game restart
- [ ] Test max health exceeds normal cap

### **Daily Login**
- [ ] Test first login (Day 1)
- [ ] Test consecutive days (Day 2-7)
- [ ] Test weekly milestone (Day 7)
- [ ] Test streak break (skip day → resets)
- [ ] Test localStorage persistence
- [ ] Test multiple logins same day (no duplicate reward)

---

## 📈 Expected Impact

| Feature | Player Benefit | Business Benefit |
|---------|----------------|------------------|
| **Wave Milestones** | Easier progression, reduced frustration | Higher retention, longer sessions |
| **100 Combo Reward** | Skill-based legendary achievement | Viral sharing, prestige |
| **Daily Login** | Consistent progression, habit formation | Daily active users (DAU) increase |

---

## 💡 Future Enhancements

### **After Quick Wins are Stable:**

1. **Wave Milestone Variety**
   - Wave 25: Bonus power-up spawn
   - Wave 50: Unlock special weapon skin

2. **Combo Tier Rewards**
   - 50 combo: +500 score bonus (already implemented)
   - 75 combo: Guaranteed power-up drop
   - 100 combo: +1 life (implementing now)
   - 150 combo: Temporary invincibility (5 seconds)

3. **Daily Login Calendar UI**
   - Visual calendar showing past 30 days
   - Checkmarks for login days
   - Preview of upcoming rewards
   - Longest streak badge

4. **Monthly Challenges**
   - "Reach wave 50 this month" → 10,000 bonus score
   - "Get 100 combo 3 times" → Exclusive ship skin

---

**Ready to implement?** Let's start with **Phase 1: Wave Milestones** first, then move to the 100 Combo Reward, and finally the Daily Login system.

Last Updated: 2025-12-30
