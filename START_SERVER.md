# 🚀 How to Start the Server

## Quick Start (Windows PowerShell)

```powershell
# Step 1: Navigate to project directory
cd "C:\Users\AVINASH\OneDrive\Desktop\Hackathon Web"

# Step 2: Install dependencies (if not already done)
npm install

# Step 3: Start the server
vercel dev
```

---

## If `vercel dev` Fails (Exit Code 1)

### Option 1: Clear Vercel Cache
```powershell
rm -Recurse -Force .vercel
vercel dev
```

### Option 2: Use Node directly (Alternative)
```powershell
npm install -g vercel
vercel dev --clear
```

### Option 3: Check Port 3000
If port 3000 is already in use:
```powershell
# Check which process uses port 3000
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

# Kill the process (if needed)
Stop-Process -Id <PID> -Force

# Then restart
vercel dev
```

---

## Verify Server is Running

✅ Server should be accessible at: **http://localhost:3000**

**Check console for:** 
- ✅ `ready - started server on...`
- ✅ No error messages about port or connection

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "Port 3000 already in use" | Kill existing process on that port |
| "Module not found" | Run `npm install` |
| "MongoDB connection failed" | Check `.env` file has MONGODB_URI |
| API returns 404 | Restart server after code changes |
| JSON parsing error | Server crashed - check console logs |

---

## If Problem Persists

1. Open terminal in VSCode
2. Run: `npm install`
3. Run: `vercel dev --clear`
4. Wait for "ready" message
5. Check http://localhost:3000
