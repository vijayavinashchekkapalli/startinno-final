# 🔧 Hackathon Management Platform - Debugging Guide

## ✅ Issues Fixed

### 1. **API File Missing** ❌→✅
- **Problem**: `getProblem.js` was empty, endpoint should be `getProblems.js` (plural)
- **Fix**: Created `api/getProblems.js` with full MongoDB integration and error handling

### 2. **MongoDB Import Path** ❌→✅
- **Problem**: Some files imported from `../lib/mongodb` but file is `mangodb.js`
- **Fix**: Updated `uploadProblem.js` to use correct import path

### 3. **No Error Handling** ❌→✅
- **Problem**: No try-catch blocks, silent failures
- **Fix**: Added comprehensive error handling in all APIs and frontend

### 4. **No Debugging Logs** ❌→✅
- **Problem**: Could not trace data flow
- **Fix**: Added detailed console logs with emoji prefixes for easy scanning

### 5. **No Empty State UI** ❌→✅
- **Problem**: Blank page if no problems exist
- **Fix**: Added fallback UI for empty state and errors

### 6. **No API Response Validation** ❌→✅
- **Problem**: Frontend assumed API always returns array
- **Fix**: Added type checking and proper error handling

---

## 🔍 Debugging With Console Logs

### Frontend Logs (Browser Console)
Open browser DevTools (F12) and check Console tab:

```
✅ [Frontend] Page initialized - main.js loaded and ready
🔄 [Frontend] Fetching problems from /api/getProblems...
📊 [Frontend] Response status: 200
✅ [Frontend] Problems received: [...]
✅ [Frontend] Total problems: 5
📌 [Frontend] Rendering problem 1: Web Development Challenge
✅ [Frontend] All problems rendered successfully
```

### Backend Logs (Vercel Dev Console)
Run `vercel dev` in terminal:

```
✅ [MongoDB] Database 'startinno' selected
📨 [getProblems API] Request received
✅ [getProblems API] MongoDB connected
📦 [getProblems API] Found 5 problems: [...]
```

---

## 🚀 Testing Steps

### 1. **Test API Directly**
```bash
# In browser console or terminal
curl http://localhost:3000/api/getProblems
```

Expected response:
```json
[
  {
    "_id": "...",
    "title": "Problem Title",
    "pdfUrl": "https://...",
    "maxTeams": 5,
    "selectedTeams": 0,
    "createdAt": "2026-04-15T..."
  }
]
```

### 2. **Verify MongoDB Connection**
- Check if `MONGODB_URI` environment variable is set in `.env`
- Look for `✅ [MongoDB] Connected successfully` in Vercel logs

### 3. **Check Frontend Loading**
1. Open http://localhost:3000
2. Open DevTools (F12)
3. Look for `✅ [Frontend] Page initialized` message
4. Check for any red errors

### 4. **Add a Test Problem**
1. Open Admin Panel
2. Click "Add Problem"
3. Check console for `✅ [uploadProblem API] Problem created`
4. Main page should refresh and show the new problem

---

## 📋 File Changes Summary

### Created:
- ✅ `api/getProblems.js` - Complete API with debugging logs

### Modified:
- ✅ `public/js/main.js` - Added debugging + error handling
- ✅ `api/submitTeam.js` - Added debugging logs + validation
- ✅ `api/uploadProblem.js` - Fixed import path + debugging
- ✅ `lib/mangodb.js` - Added connection debugging logs
- ✅ `public/css/style.css` - Added empty/error state styles

---

## ⚠️ Common Issues & Solutions

### Issue: "No problems available yet"
**Cause**: Database is empty
**Solution**: Go to Admin Panel and add problems first

### Issue: "API returned status 500"
**Cause**: MongoDB connection failed
**Solution**: 
- Check `MONGODB_URI` in `.env`
- Check MongoDB Atlas IP whitelist
- Look for `❌ [MongoDB] Connection error` in logs

### Issue: Response from API but no cards show
**Cause**: API returns wrong format
**Check**: Browser console shows `Total problems: 0` or `Not an array`
**Solution**: Verify MongoDB data structure

### Issue: Folder naming (public vs Public)
**Status**: ✅ Fixed - Using lowercase `public/` (Vercel convention)

---

## 🔗 API Endpoints

| Endpoint | Method | Purpose | Logs |
|----------|--------|---------|------|
| `/api/getProblems` | GET | Fetch all problems | 📨 getProblems API |
| `/api/submitTeam` | POST | Submit team for problem | 🚀 submitTeam API |
| `/api/uploadProblem` | POST | Add new problem (Admin) | 📋 uploadProblem API |

---

## 💡 Next Steps for Production

1. **Environment Variables** - Ensure `.env` has:
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
   ```

2. **Database Initialization** - Create MongoDB collections:
   ```javascript
   db.createCollection("problems")
   db.createCollection("submissions")
   ```

3. **Error Boundaries** - Add frontend error page component

4. **Rate Limiting** - Add API rate limiting for production

5. **Logging Service** - Use Sentry or similar for error tracking

---

## 📞 Debug Checklist

- [ ] `✅ [Frontend] Page initialized` appears in console
- [ ] `✅ [MongoDB] Connected successfully` appears in Vercel logs
- [ ] `📦 [getProblems API] Found X problems` shows > 0
- [ ] Problem cards render without errors
- [ ] Submit button works and shows success message
- [ ] Team list updates after submission
- [ ] Error messages appear when things fail

---

**Last Updated**: April 15, 2026
**Status**: All major issues fixed ✅
