# Role-Based MongoDB Login System - Setup Guide

## Overview
The authentication system has been converted from hardcoded credentials to a proper MongoDB-based system with role-based login (Participant and Admin).

## Features Implemented

### 1. **Role-Based Login**
- **Participant Login** (Green): Username + Password
- **Admin Login** (Blue/Purple): Email + Password

### 2. **Database Collections**
- **users** collection stores all user accounts with their role, credentials, and timestamps

### 3. **Frontend Changes**
- **Unified Login Page** in both `admin.html` and `index.html`
- **Role Selection Buttons**: Green for Participant, Blue for Admin
- **Conditional Forms**: Different input fields based on selected role
- **Color-Coded UI**: Green for participant flows, Blue/Purple for admin flows

## Step-by-Step Setup

### Step 1: Initialize Test Users in Database

When you start your server, call this API endpoint **ONCE** to create test users:

```bash
curl http://localhost:3000/api/initializeUsers
```

Or visit in browser:
```
http://localhost:3000/api/initializeUsers
```

**Response:**
```json
{
  "success": true,
  "message": "Initialized 5 test users successfully",
  "users": {
    "participants": [
      { "username": "team1", "password": "team@123" },
      { "username": "team2", "password": "team@123" },
      { "username": "participant", "password": "password123" }
    ],
    "admins": [
      { "email": "admin@startinno.com", "password": "admin@123" },
      { "email": "vijayavinashchekkapalli4@gmail.com", "password": "Vijay@vi235" }
    ]
  }
}
```

⚠️ **Note**: This API will only work once. If users already exist, it will skip initialization.

### Step 2: Test Participant Login

1. Navigate to: `http://localhost:3000/index.html`
2. Select "👤 Participant" role (green button)
3. Enter credentials:
   - Username: `team1`
   - Password: `team@123`
4. Click "Login"

**Expected**: Should login and show problem selection interface

### Step 3: Test Admin Login

1. Navigate to: `http://localhost:3000/admin.html`
2. Select "👨‍💼 Admin" role (blue button)
3. Enter credentials:
   - Email: `admin@startinno.com`
   - Password: `admin@123`
4. Click "Login as Admin"

**Expected**: Should login and show admin dashboard

### Step 4: Register New Users (Optional)

To register new users programmatically, use the registration API:

```bash
# Register a participant
curl -X POST http://localhost:3000/api/registerUser \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newteam",
    "password": "newpass123",
    "role": "participant"
  }'

# Register an admin
curl -X POST http://localhost:3000/api/registerUser \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "adminpass123",
    "role": "admin"
  }'
```

## API Endpoints

### Login API
**Endpoint**: `POST /api/login`

**Participant Login:**
```json
{
  "username": "team1",
  "password": "team@123",
  "role": "participant"
}
```

**Admin Login:**
```json
{
  "email": "admin@startinno.com",
  "password": "admin@123",
  "role": "admin"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "base64_encoded_token",
  "role": "participant|admin",
  "userId": "mongodb_user_id",
  "username": "team1" // For participant
  "email": "admin@startinno.com" // For admin
}
```

### Register User API
**Endpoint**: `POST /api/registerUser`

**Participant Registration:**
```json
{
  "username": "team1",
  "password": "team@123",
  "role": "participant"
}
```

**Admin Registration:**
```json
{
  "email": "admin@startinno.com",
  "password": "admin@123",
  "role": "admin"
}
```

## Files Modified

### Backend
- **`api/login.js`**: Converted to MongoDB-based authentication with role support
- **`api/registerUser.js`**: NEW - User registration endpoint
- **`api/initializeUsers.js`**: NEW - Database initialization endpoint

### Frontend
- **`public/index.html`**: Added participant login screen
- **`public/admin.html`**: Updated login with role selection
- **`public/css/style.css`**: Added participant login styling (green theme)
- **`public/css/admin-style.css`**: Added role selection and dual-form styling
- **`public/js/main.js`**: Added authentication checks and login/logout functions
- **`public/js/admin.js`**: Updated to handle role-based admin login

## Color Scheme

| Role        | Color  | RGB/Hex       | Purpose                    |
|-------------|--------|---------------|----------------------------|
| Participant | Green  | #22c55e       | User participant interface |
| Admin       | Purple | #667eea       | Admin control panel        |

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  role: "participant" | "admin",
  
  // For Participant
  username: String,
  
  // For Admin
  email: String,
  
  password: String, // In production, use bcrypt hashing!
  createdAt: Date,
  updatedAt: Date
}
```

## Security Notes ⚠️

**For Production, you MUST:**

1. **Hash Passwords**: Use `bcryptjs` to hash passwords
   ```bash
   npm install bcryptjs
   ```
   
2. **Use JWT Tokens**: Replace Base64 tokens with JWT
   ```bash
   npm install jsonwebtoken
   ```

3. **Enable HTTPS**: Ensure all communication is encrypted

4. **Remove Test Users**: Delete the initializeUsers API after setup

5. **Environment Variables**: Store admin credentials in `.env` file

6. **Database Validation**: Add input validation and sanitization

## Troubleshooting

### "User not found" error
- Ensure test users are initialized using `/api/initializeUsers`
- Check MongoDB connection in `.env` file

### Login page not showing
- Clear browser localStorage: `localStorage.clear()`
- Refresh the page

### Users not persisting
- Check MongoDB connection
- Verify `startinno` database exists

### Can't login after database changes
- Delete the test user using MongoDB admin
- Reinitialize with `/api/initializeUsers`

## Next Steps

1. ✅ Call `/api/initializeUsers` to create test users
2. ✅ Test participant login at `/index.html`
3. ✅ Test admin login at `/admin.html`
4. 🔄 Implement password hashing (production)
5. 🔄 Add JWT token support (production)
