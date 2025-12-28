# ⚙️ Git Setup Required - ONE TIME ONLY

Before you can commit to GitHub, you need to tell git who you are. This is a **one-time setup**.

---

## 🎯 What You Need to Do

### Option 1: Using Your GitHub Email (Recommended)

```bash
git config --global user.name "Your Name"
git config --global user.email "your-github-email@example.com"
```

**Replace with YOUR information:**
- `"Your Name"` - Your real name or GitHub username
- `"your-github-email@example.com"` - The email you use for GitHub

**Example:**
```bash
git config --global user.name "Mrjavoweb"
git config --global user.email "mrjavoweb@gmail.com"
```

---

### Option 2: Keep Email Private (GitHub Option)

If you want to keep your email private, use GitHub's no-reply email:

```bash
git config --global user.name "Mrjavoweb"
git config --global user.email "username@users.noreply.github.com"
```

Replace `username` with your GitHub username.

**To find your GitHub no-reply email:**
1. Go to https://github.com/settings/emails
2. Look for: `ID+username@users.noreply.github.com`
3. Use that email

---

## ✅ Verify It Worked

```bash
git config --global user.name
git config --global user.email
```

Should show your name and email.

---

## 🚀 After Setup - Commit Your Changes

Once configured, run these commands:

```bash
# Navigate to your project
cd "p:\0000 Appinstall Blackbox\0000 MY PWA  APPS\Alien Invasion Neon"

# Make sure changes are staged
git add .

# Commit
git commit -m "🎮 Convert to PWA with offline support and documentation"

# Push to GitHub
git push origin main
```

---

## ⚠️ This is a ONE-TIME setup

You only need to do this ONCE on your computer. After that, all future commits will use these credentials automatically.

---

## 🆘 Still Having Issues?

### Issue: "Permission denied"

**Solution:** You may need to authenticate with GitHub.

**Option A: Use GitHub Desktop** (Easiest for beginners)
1. Download: https://desktop.github.com/
2. Sign in with your GitHub account
3. Open your repository in GitHub Desktop
4. Commit and push from there

**Option B: Generate Personal Access Token**
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Give it a name: "Git CLI Access"
4. Select scopes: `repo` (all)
5. Generate token
6. Copy the token
7. Use it as your password when git asks

---

## 📝 Quick Summary

**Run these 2 commands** (replace with your info):

```bash
git config --global user.name "Your GitHub Username"
git config --global user.email "your-email@example.com"
```

**Then commit and push:**

```bash
git add .
git commit -m "🎮 Convert to PWA"
git push origin main
```

**That's it!** 🎉

---

**Need more help?** Open [GITHUB-SYNC-GUIDE.md](./GITHUB-SYNC-GUIDE.md) for detailed instructions.
