# 🚀 StartInno Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Ensure Environment Variables
Create or update `.env` file in project root:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start Vercel Dev Server
```bash
vercel dev
```

Expected output:
```
✓ Subnets successfully created
✓ Env loaded
- APIs: http://localhost:3000/api
- Web: http://localhost:3000
```

### Step 4: Test the Application
1. Open http://localhost:3000 in browser
2. Open DevTools (F12) → Console tab
3. Should see: `✅ [Frontend] Page initialized - main.js loaded and ready`

---

## ✅ Working Indicators

### Green Lights (Everything Working)
- ✅ Console shows: `✅ [Frontend] Page initialized`
- ✅ Vercel logs show: `✅ [getProblems API] MongoDB connected`
- ✅ Home page shows problem cards OR empty state message
- ✅ Admin page lets you add problems

### Red Lights (Something Wrong)
- ❌ Blank page with no error message → Check browser console (F12)
- ❌ Console shows `❌ [Frontend] Error loading problems` → Check API response
- ❌ Vercel logs show `❌ [MongoDB] Connection error` → Check MONGODB_URI
- ❌ 404 error → API endpoint renamed issue

---

## 🔍 Quick Debugging

### Problem: "Website loads but no cards show"
```bash
# Open browser console (F12) and check for:
❌ [Frontend] Error loading problems
# Then check:
❌ [getProblems API] Error
# Root causes:
- MONGODB_URI not set
- mongoDB cluster connection issue
- No data in database
```

### Problem: "API returns 404"
```
Vercel routes: /api/getProblems → /api/getProblems.js
- Check file is named exactly: getProblems.js
- Case sensitive! Not getProblem.js
```

### Problem: "TypeError: Cannot read property 'forEach'"
```
API is returning null or non-array
- Check: `📦 [getProblems API] Found 0 problems` in Vercel logs
- Solution: Add data in Admin panel first
```

---

## 📱 Project Structure (Correct Layout)

```
Hackathon Web/
├── package.json
├── vercel.json
├── .env                          ← Create this with MONGODB_URI
├── api/
│   ├── getProblems.js           ← ✅ FIXED (was empty)
│   ├── submitTeam.js            ← ✅ FIXED (import path)
│   ├── uploadProblem.js         ← ✅ FIXED (import path)
│   └── ...
├── public/
│   ├── index.html
│   ├── admin.html
│   ├── css/
│   │   └── style.css            ← ✅ FIXED (added styles)
│   └── js/
│       ├── main.js              ← ✅ FIXED (added logging)
│       └── ...
└── lib/
    └── mangodb.js               ← ✅ FIXED (added logging)
```

---

## 🧪 Test Workflow

### Test 1: Does API work?
```bash
curl "http://localhost:3000/api/getProblems" | json_pp
```
Expected: Empty array `[]` (OK if empty, add data first)

### Test 2: Does Admin work?
1. Go to http://localhost:3000/admin.html
2. Fill in:
   - Title: "Test Problem"
   - PDF Link: "https://example.com/test.pdf"
   - Max Teams: "5"
3. Click "Add Problem"
4. Check Vercel console for success message
5. Reload http://localhost:3000
6. Should see your new problem card

### Test 3: Does Submit work?
1. Enter a team name
2. Click "Select"
3. Alert should appear: "Submitted successfully"
4. Team count should increase

---

## 🐛 Monitoring Console Output

### Browser Console (Open with F12)
Look for these SUCCESS indicators:
```
✅ [Frontend] Page initialized - main.js loaded and ready
🔄 [Frontend] Fetching problems from /api/getProblems...
📊 [Frontend] Response status: 200
✅ [Frontend] Problems received: (5) [{…}, {…}, ...]
📌 [Frontend] Rendering problem 1: Web Dev Challenge
✅ [Frontend] All problems rendered successfully
```

### Vercel Dev Console
Look for these SUCCESS indicators:
```
✅ [MongoDB] Connected successfully
✅ [MongoDB] Database 'startinno' selected
📨 [getProblems API] Request received
✅ [getProblems API] MongoDB connected
📦 [getProblems API] Found 5 problems: [...]
```

---

## 🚨 Emergency Fixes

### If you see "No problems available yet"
1. This is actually OK! It means the app is working
2. Go to Admin panel and add a problem
3. Refresh homepage
4. Your problem should appear

### If you see Error page
1. Check browser console (F12)
2. Scroll to find the red `❌` messages
3. Copy the error message and search in [DEBUG_GUIDE.md](DEBUG_GUIDE.md)

### If nothing shows up
1. Press F12 to open DevTools
2. Go to Console tab
3. Look for `✅ [Frontend] Page initialized`
4. If you don't see it, main.js didn't load
5. Check network tab for 404 on main.js

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| [DEBUG_GUIDE.md](DEBUG_GUIDE.md) | Comprehensive debugging with all issues fixed |
| [CODE_REFERENCE.md](CODE_REFERENCE.md) | All updated code files with changes explained |
| [README.md](README.md) | Project overview |
| This file | Quick start guide |

---

## 🎯 Next Steps

1. **Set MONGODB_URI** in `.env`
2. **Run `npm install`**
3. **Start with `vercel dev`**
4. **Open http://localhost:3000**
5. **Check DevTools console** for success messages
6. **Add problem from Admin panel**
7. **See it appear on homepage**
8. **Submit a team and see count update**

---

## ✨ Success Checklist

- [ ] `vercel dev` runs without errors
- [ ] http://localhost:3000 loads
- [ ] Browser console shows initialization message
- [ ] Can see "No problems available yet" message (or problem cards if data exists)
- [ ] Can add a problem from admin page
- [ ] New problem appears on homepage
- [ ] Can submit a team and see count update

**If all checked: 🎉 Your app is working!**

---

**Status**: ✅ All Issues Fixed & Tested
**Date**: April 15, 2026
