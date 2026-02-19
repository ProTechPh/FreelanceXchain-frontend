# Frontend Demo - Quick Reference
**15-Minute Quick Demo Script**

---

## 🚀 Quick Setup (2 minutes)

```bash
# Terminal 1: Backend
cd FreelanceXchain-api
npm run dev

# Terminal 2: Frontend  
cd FreelanceXchain-frontend
npm run dev

# Browser
open http://localhost:5173
```

---

## 🎯 Demo Flow (13 minutes)

### 1. Authentication & Tokens (3 min)

**Show:**
1. Login page → Enter credentials
2. DevTools → Application → Local Storage
3. Show `accessToken` and `refreshToken`
4. Network tab → Show `Authorization: Bearer <token>`

**Say:**
"JWT tokens automatically managed. Secure storage. Included in all API requests."

---

### 2. CSRF Protection (2 min)

**Show:**
1. Network tab → Filter "csrf-token"
2. Application → Cookies → `psifi.x-csrf-token`
3. Any POST request → Headers → `X-CSRF-Token`

**Say:**
"CSRF protection using double-submit cookie. Automatic token fetch and inclusion."

---

### 3. MFA Enrollment (4 min)

**Show:**
1. Settings → Security → "Enable MFA"
2. QR code modal appears
3. Scan with Google Authenticator
4. Enter 6-digit code
5. MFA enabled ✅

**Say:**
"Complete MFA with TOTP. QR code for easy setup. Works with any authenticator app."

---

### 4. File Upload (2 min)

**Show:**
1. Create Project → Upload file
2. Try invalid type → Error
3. Try large file → Error
4. Upload valid file → Success

**Say:**
"Client-side validation. Size and type checking. CSRF token included automatically."

---

### 5. Role-Based Access (2 min)

**Show:**
1. Login as Freelancer → Show available features
2. Login as Admin → Show admin panel
3. Try admin route as freelancer → Blocked

**Say:**
"Different UI for different roles. Protected routes. Permission checks."

---

## 📊 Visual Checklist

```
┌─────────────────────────────────────────┐
│     FRONTEND SECURITY FEATURES          │
├─────────────────────────────────────────┤
│                                         │
│  ✅ JWT Authentication                  │
│  ✅ Automatic Token Refresh             │
│  ✅ CSRF Protection                     │
│  ✅ MFA with QR Code                    │
│  ✅ Secure File Upload                  │
│  ✅ Role-Based Access Control           │
│  ✅ Error Sanitization                  │
│  ✅ Session Management                  │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔑 Test Accounts

```
Admin:
Email: admin@example.com
Password: YourPassword123

Freelancer:
Email: freelancer@test.com
Password: password123

Employer:
Email: employer@test.com
Password: password123
```

---

## 💡 Key Talking Points

### Security
- "JWT tokens for stateless authentication"
- "CSRF protection prevents cross-site attacks"
- "MFA adds extra layer of security"
- "All sensitive data encrypted in transit"

### User Experience
- "Automatic token refresh - seamless experience"
- "User-friendly error messages"
- "Loading states prevent double-submission"
- "Toast notifications for feedback"

### Code Quality
- "TypeScript for type safety"
- "React hooks for reusability"
- "Clean architecture"
- "Comprehensive error handling"

---

## 🎨 What to Show in DevTools

### Application Tab
- Local Storage: `accessToken`, `refreshToken`, `auth-storage`
- Cookies: `psifi.x-csrf-token`
- Session Storage: (empty - using localStorage)

### Network Tab
- POST `/api/auth/login` → Returns tokens
- POST `/api/auth/csrf-token` → Sets cookie
- Any POST request → Includes `X-CSRF-Token` header
- GET requests → Includes `Authorization` header

### Console Tab
- No errors (clean console)
- Debug logs (if enabled)
- CSRF token logs

---

## 🔍 Code to Show

### 1. API Client (src/lib/api.ts)
```typescript
// JWT token management
setTokens(access: string, refresh: string)

// CSRF token handling
getCsrfTokenFromCookie()
fetchCsrfToken()

// Automatic refresh
refreshTokens()

// Error sanitization
sanitizeApiError()
```

### 2. Auth Store (src/store/index.ts)
```typescript
// Login/logout
login(email, password)
logout()

// State management
user, isAuthenticated, isLoading
```

### 3. MFA Hook (src/features/mfa/hooks.ts)
```typescript
// MFA operations
enroll()
verifyEnrollment()
disable()
```

---

## 🚨 If Something Breaks

### Backend Not Running
→ Show code instead
→ Explain architecture
→ Show documentation

### CORS Error
→ Check `.env` file
→ Show CORS configuration
→ Explain same-origin policy

### CSRF Token Missing
→ Manually trigger: `api.fetchCsrfToken()`
→ Show cookie in DevTools
→ Explain double-submit pattern

### MFA Not Working
→ Check authenticator app time sync
→ Show QR code generation code
→ Explain TOTP algorithm

---

## 📱 Bonus: Mobile Demo

**If time permits:**
1. Open DevTools → Toggle device toolbar
2. Select iPhone/Android
3. Show responsive design
4. Test touch interactions
5. Show mobile navigation

---

## 🎓 Professor Questions - Quick Answers

**Q: "How do you prevent XSS?"**
A: "React automatically escapes output. TypeScript for type safety. Content Security Policy headers from backend."

**Q: "What about SQL injection?"**
A: "Backend uses parameterized queries. Frontend validates input. TypeScript prevents type mismatches."

**Q: "How secure is localStorage?"**
A: "Vulnerable to XSS, but we mitigate with CSP, React escaping, and short token expiry. Refresh tokens for long-term auth."

**Q: "Why CSRF if using JWT?"**
A: "Defense in depth. JWT in localStorage vulnerable to XSS. CSRF adds extra layer. Double-submit cookie pattern."

**Q: "Can users bypass client validation?"**
A: "Yes, but server validates everything. Client validation is UX, not security. Server is final authority."

---

## ✅ Pre-Demo Checklist

**5 Minutes Before:**
- [ ] Backend running
- [ ] Frontend running
- [ ] Browser DevTools open
- [ ] Test accounts ready
- [ ] Authenticator app ready
- [ ] Network tab cleared
- [ ] Console tab cleared

**During Demo:**
- [ ] Speak clearly
- [ ] Show code + live demo
- [ ] Explain why, not just what
- [ ] Handle questions confidently
- [ ] Stay calm if something breaks

---

## 🎉 Closing Statement

"Ang FreelanceXchain frontend ay may comprehensive security implementation:

- ✅ JWT authentication with automatic refresh
- ✅ CSRF protection with double-submit cookie
- ✅ MFA support with TOTP standard
- ✅ Secure file uploads with validation
- ✅ Role-based access control
- ✅ Error sanitization for production
- ✅ Session management with cleanup

All integrated seamlessly for great user experience while maintaining high security standards."

---

**Good luck sa demo! 🚀**
