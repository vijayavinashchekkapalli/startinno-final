# Testing Guide - MongoDB-Based Role Login System

## Pre-Test Checklist

- [x] MongoDB connection configured in `.env`
- [x] All APIs created in `/api` folder
- [x] All frontend files updated
- [x] CSS styling applied
- [x] JavaScript authentication logic implemented

## Test Scenario 1: Initialize Database

**Goal**: Create test users in MongoDB

**Steps**:
1. Start your server
2. Open browser and navigate to:
   ```
   http://localhost:3000/api/initializeUsers
   ```
   (Or use curl: `curl http://localhost:3000/api/initializeUsers`)

**Expected Result**:
```json
{
  "success": true,
  "message": "Initialized 5 test users successfully",
  "users": {
    "participants": [...],
    "admins": [...]
  }
}
```

**What Happens**:
- ✅ 3 participant users created
- ✅ 2 admin users created
- ✅ All stored in MongoDB `users` collection

---

## Test Scenario 2: Participant Login - Successful

**Goal**: Login as a participant using credentials

**Steps**:
1. Navigate to: `http://localhost:3000/index.html`
2. You should see a **green login box** titled "🟢 Participant Login"
3. By default, "👤 Participant" role is selected (green button)
4. Enter credentials:
   - Username: `team1`
   - Password: `team@123`
5. Click "Login" button (green gradient)

**Expected Result**:
- ✅ Login successful message
- ✅ Redirected to main hackathon dashboard
- ✅ See problems list
- ✅ Header shows "🚪 Logout" button
- ✅ Session saved in localStorage

**Browser Console**:
```
✅ [Participant] Page loaded
✅ [Participant] Attempting login...
📊 [Participant] Login response: {success: true, ...}
✅ [Participant] Login successful
```

---

## Test Scenario 3: Participant Logout

**Goal**: Logout as participant and return to login

**Steps**:
1. After successful participant login
2. Click "🚪 Logout" button in header
3. Verify you're back at login screen

**Expected Result**:
- ✅ Login form reappears
- ✅ Input fields cleared
- ✅ Green theme visible
- ✅ localStorage cleared

**Browser Console**:
```
🚪 [Participant] Logging out...
```

---

## Test Scenario 4: Admin Login - Role Selection

**Goal**: Switch between roles and login as admin

**Steps**:
1. Navigate to: `http://localhost:3000/admin.html`
2. Click "👨‍💼 Admin" button (blue/purple)
3. Observe form change to email + password fields
4. Enter credentials:
   - Email: `admin@startinno.com`
   - Password: `admin@123`
5. Click "Login as Admin" button (blue gradient)

**Expected Result**:
- ✅ Admin role selected (button turns blue)
- ✅ Form changes to email + password
- ✅ Login successful
- ✅ Admin dashboard displayed
- ✅ Session saved in localStorage

**Visual Changes**:
- Button color: White → Blue
- Input fields: Email + Password
- Button text: "Login as Admin"

---

## Test Scenario 5: Input Validation

**Goal**: Test error handling for blank inputs

**Steps**:
1. Navigate to participant login
2. Leave inputs empty
3. Click "Login" button

**Expected Result**:
- ✅ Error message: "Please enter username and password"
- ✅ Red error box displayed
- ✅ No API call made

---

## Test Scenario 6: Invalid Credentials

**Goal**: Test error handling for wrong credentials

**Steps**:
1. Navigate to participant login
2. Enter: Username: `team1`, Password: `wrongpassword`
3. Click "Login"

**Expected Result**:
- ✅ Error message: "Invalid username or password"
- ✅ Login fails (no redirect)
- ✅ Can retry with correct credentials

**Browser Console**:
```
❌ [Participant] Login failed: Invalid username or password
```

---

## Test Scenario 7: Non-Existent User

**Goal**: Test when user doesn't exist in database

**Steps**:
1. Navigate to participant login
2. Enter: Username: `nonexistent`, Password: `password123`
3. Click "Login"

**Expected Result**:
- ✅ Error message: "Invalid username or password"
- ✅ Login fails
- ✅ No user created (error only)

---

## Test Scenario 8: Session Persistence

**Goal**: Verify login session survives page reload

**Steps**:
1. Login as participant
2. Refresh page (F5 or Ctrl+R)
3. Observe page state

**Expected Result**:
- ✅ No login form appears
- ✅ Dashboard loads directly
- ✅ User session restored
- ✅ Console shows: "✅ [Participant] Restored session for: team1"

---

## Test Scenario 9: Role Switching (Admin Page)

**Goal**: Switch between participant and admin on admin.html

**Steps**:
1. Navigate to: `http://localhost:3000/admin.html`
2. Click "👤 Participant" (green button)
3. Observe form changes
4. Click "👨‍💼 Admin" (blue button)
5. Observe form changes again

**Expected Result**:
- ✅ Participant form: username + password
- ✅ Admin form: email + password
- ✅ Button colors toggle correctly
- ✅ Forms hidden/shown appropriately
- ✅ Console: "✅ [Auth] Switched to [role] login"

---

## Test Scenario 10: Register New User

**Goal**: Create a new participant account

**Steps**:
1. Open terminal/cmd
2. Run curl command:
   ```bash
   curl -X POST http://localhost:3000/api/registerUser \
     -H "Content-Type: application/json" \
     -d '{
       "username": "newteam",
       "password": "newpass123",
       "role": "participant"
     }'
   ```

**Expected Result**:
```json
{
  "success": true,
  "message": "participant user registered successfully",
  "userId": "mongodb_id"
}
```

**Verification**:
- ✅ Login with credentials: newteam / newpass123
- ✅ Should work the same as test users

---

## Test Scenario 11: Duplicate Username Prevention

**Goal**: Ensure same username can't be registered twice

**Steps**:
1. Run registration again with same username:
   ```bash
   curl -X POST http://localhost:3000/api/registerUser \
     -H "Content-Type: application/json" \
     -d '{
       "username": "team1",
       "password": "newpass",
       "role": "participant"
     }'
   ```

**Expected Result**:
```json
{
  "success": false,
  "message": "Username already exists"
}
```

---

## Test Scenario 12: Enter Key Support

**Goal**: Login using Enter key instead of button click

**Steps**:
1. Navigate to participant login
2. Enter username: `team1`
3. Enter password: `team@123`
4. Press Enter key on password field
5. Observe login attempt

**Expected Result**:
- ✅ Login triggered
- ✅ No button click needed
- ✅ Same success as clicking button

---

## Common Issues & Solutions

### Issue: "User not found"
**Solution**: 
```bash
curl http://localhost:3000/api/initializeUsers
```
Reinitialize database with test users.

### Issue: Login page stuck
**Solution**:
```javascript
localStorage.clear()
location.reload()
```

### Issue: MongoDB connection error
**Solution**:
- Check `.env` file for `MONGODB_URI`
- Verify MongoDB is running
- Check connection string format

### Issue: APIs return 404
**Solution**:
- Verify `api/*.js` files exist
- Check server is running with correct port
- Restart server

---

## Success Indicators

✅ **If you see all of these, the system is working correctly:**

1. Green participant login screen on `/index.html`
2. Role selection on `/admin.html`
3. Test users created via `/api/initializeUsers`
4. Successful login redirects to dashboard
5. Logout clears session and shows login
6. Error messages appear for invalid inputs
7. Session persists across page reloads
8. New users can be registered via API
9. Duplicate prevention works
10. Enter key triggers login

---

## Performance Notes

- **Login Response**: < 500ms (MongoDB query + network)
- **Session Restoration**: < 100ms (localStorage only)
- **Auto-refresh**: Every 15 seconds (participant page)

---

## Next Steps After Testing

1. ✅ Verify all test scenarios pass
2. 🔄 Hash passwords for production (bcryptjs)
3. 🔄 Use JWT tokens instead of Base64
4. 🔄 Add rate limiting to prevent brute force
5. 🔄 Implement email verification
6. 🔄 Add password reset functionality
