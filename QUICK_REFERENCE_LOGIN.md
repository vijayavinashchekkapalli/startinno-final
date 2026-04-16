# Role-Based MongoDB Login - Quick Reference

## What Was Done

✅ **Converted from Hardcoded to MongoDB Login:**
- Participant login: username + password (Green UI)
- Admin login: email + password (Blue/Purple UI)

✅ **Created New API Endpoints:**
- `/api/login` - MongoDB-based authentication
- `/api/registerUser` - User registration
- `/api/initializeUsers` - Test data seeding

✅ **Updated Frontend:**
- Participant login page in `index.html` (Green theme)
- Unified role-based login in `admin.html`
- Participant authentication in main application

## Test Credentials

After initializing database with `/api/initializeUsers`:

**Participant:**
- Username: `team1` → Password: `team@123`

**Admin:**
- Email: `admin@startinno.com` → Password: `admin@123`

## Quick Start

```bash
# 1. Start your server (already running)

# 2. Initialize test users (ONCE only)
curl http://localhost:3000/api/initializeUsers

# 3. Test participant login
# Visit: http://localhost:3000/index.html
# Select: 👤 Participant
# Login: team1 / team@123

# 4. Test admin login
# Visit: http://localhost:3000/admin.html
# Select: 👨‍💼 Admin
# Login: admin@startinno.com / admin@123
```

## File Structure

```
api/
├── login.js              ← MongoDB-based login
├── registerUser.js       ← NEW - User registration
├── initializeUsers.js    ← NEW - Test data seeding
└── ... (other APIs)

public/
├── index.html            ← Updated with participant login
├── admin.html            ← Updated role selection
├── css/
│   ├── style.css         ← Added participant login styling
│   └── admin-style.css   ← Added role selection styling
└── js/
    ├── main.js           ← Added authentication checks
    └── admin.js          ← Updated role-based login
```

## Color Coding

| Element | Color | Hex | Use Case |
|---------|-------|-----|----------|
| Participant Login | Green | #22c55e | User login screen |
| Admin Login | Blue | #667eea | Admin dashboard |
| Logout | Red | #f44336 | Sign out button |

## Database

**Collection**: `users`

**Document Structure**:
```javascript
{
  role: "participant" | "admin",
  username: "team1",      // Participants only
  email: "admin@email",   // Admins only
  password: "plaintext",  // TODO: Hash in production!
  createdAt: Date,
  updatedAt: Date
}
```

## Next Steps

1. **Production Security** (Important!):
   - Hash passwords with bcryptjs
   - Use JWT tokens instead of Base64
   - Implement rate limiting
   - Add CORS protection

2. **Enhancements**:
   - Email verification for admins
   - Password reset functionality
   - Session timeout
   - User management dashboard
