# 🔧 **API Error Troubleshooting Guide**

## **Errors You're Seeing:**

### ❌ **User Panel:** "API Error: API returned status 404"
- **Cause:** `getProblems` API endpoint not found or server crashed
- **Solution:** Restart server (see below)

### ❌ **Admin Panel:** "Error: Failed to execute 'json' on 'Response': Unexpected end of JSON input"
- **Cause:** Upload API returning corrupted/empty response
- **Fixed:** Updated uploadProblem.js with proper return statements ✅

---

## **🚀 Step-by-Step Fix**

### **Step 1: Clear Everything & Restart Server**

```powershell
# 1. Open PowerShell in project folder
cd "C:\Users\AVINASH\OneDrive\Desktop\Hackathon Web"

# 2. Kill any existing processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# 3. Clear Vercel cache
Remove-Item -Path .vercel -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path .next -Recurse -Force -ErrorAction SilentlyContinue

# 4. Install dependencies fresh
npm install

# 5. Start server with clear flag
vercel dev --clear
```

### **Step 2: Wait for Server Ready Message**

Look for this in console:
```
✓ Ready! Available at http://localhost:3000
```

### **Step 3: Test in Browser**

**User Panel Test:**
```
http://localhost:3000
```
(Should NOT show "API Error: API returned status 404")

**Admin Panel Test:**
```
http://localhost:3000/admin.html
```
(Should load without errors)

---

## **If Error Persists: Debug Steps**

### **Check API Manually**

Open browser and visit:
```
http://localhost:3000/api/getProblems
```

Should show:
- ✅ A JSON array (even if empty: `[]`)
- ❌ NOT a 404 error
- ❌ NOT "Cannot GET /api/getProblems"

### **Check Console Logs**

In PowerShell where `vercel dev` is running, look for:

✅ **Good:**
```
✅ [getProblems API] MongoDB connected
📦 [getProblems API] Found X problems
```

❌ **Bad:**
```
❌ [getProblems API] Error: connection refused
ECONNREFUSED
```

If MongoDB connection fails:
- ✅ Verify `.env` file has `MONGODB_URI=...`
- ✅ Check MongoDB server is running
- ✅ Test connection string

---

## **What I Fixed**

I updated `/api/uploadProblem.js`:
- ❌ Removed broken `return;` statement that caused JSON corruption
- ✅ Added proper `return` before all API responses
- ✅ Fixed response structure consistency

---

## **Quick Checklist**

- [ ] Server running: `vercel dev` shows "Ready! Available at"
- [ ] Browser shows http://localhost:3000 homepage
- [ ] No 404 errors in browser console (F12 → Console tab)
- [ ] Visit http://localhost:3000/api/getProblems → Shows JSON
- [ ] Upload button works → File link accepted
- [ ] View Files button works → Shows file preview

---

## **Still Having Issues?**

1. **Check JavaScript Console** (Browser F12 → Console)
   - Look for network error details
   - Check API response status

2. **Check Network Tab** (Browser F12 → Network)
   - Click to trigger action
   - Look at request/response headers
   - Check response body (should be JSON)

3. **Check Server Console** (PowerShell where vercel dev runs)
   - Look for error messages
   - Check if API is even being called
   - Verify MongoDB connection

---

**Need Help?** Share:
1. Full error message from browser console
2. Server console output when error occurs
3. Network tab response for failed request
