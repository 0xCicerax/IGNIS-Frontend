# Deploy IGNIS to Vercel

## Option 1: Using the Script (Easiest)

```bash
# 1. Extract the zip
unzip ignis-github-ready.zip
cd ignis-combined

# 2. Run the setup script
chmod +x setup-github.sh
./setup-github.sh
```

The script will ask for your GitHub repo URL and push everything.

---

## Option 2: Manual Commands

```bash
# 1. Extract and enter folder
unzip ignis-github-ready.zip
cd ignis-combined

# 2. Create a repo on GitHub (github.com/new), then:
git init
git add .
git commit -m "Initial commit: IGNIS Protocol Frontend"
git remote add origin https://github.com/YOUR_USERNAME/ignis-frontend.git
git branch -M main
git push -u origin main
```

---

## Then Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Log in with GitHub
3. Click **"Add New..."** → **"Project"**
4. Select your `ignis-frontend` repository
5. Click **"Deploy"**

**Done!** Your site will be live at `https://ignis-frontend.vercel.app`

---

## That's It!

- No configuration needed
- No environment variables required
- App works in demo mode automatically
