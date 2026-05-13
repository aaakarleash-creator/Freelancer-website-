# 🏗️ Expert Arena - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      REACT FRONTEND (SPA)                       │
│                   (src/ folder structure)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              AUTH CONTEXT (Global State)                 │   │
│  │         src/context/AuthContext.jsx                      │   │
│  │  - currentUser, isAuthenticated, loading                 │   │
│  │  - login(), logout(), signup()                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                    │
│                      Uses:                                      │
│                      ↓                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            SERVICE LAYER (Business Logic)                │   │
│  │                                                          │   │
│  │  authService.js                                         │   │
│  │  ├─ signupUser()                                        │   │
│  │  ├─ loginUser()                                         │   │
│  │  ├─ logoutUser()                                        │   │
│  │  └─ getCurrentUser()                                    │   │
│  │                                                          │   │
│  │  leadService.js                                         │   │
│  │  ├─ addLead()                                           │   │
│  │  ├─ getUserLeads()                                      │   │
│  │  ├─ updateLeadStatus()                                  │   │
│  │  └─ deleteLead()                                        │   │
│  │                                                          │   │
│  │  leaderboardService.js                                  │   │
│  │  ├─ getLeaderboard()                                    │   │
│  │  ├─ getUserRank()                                       │   │
│  │  └─ getTopPerformers()                                  │   │
│  │                                                          │   │
│  │  earningsService.js                                     │   │
│  │  ├─ getUserEarnings()                                   │   │
│  │  ├─ calculateTotalEarnings()                            │   │
│  │  ├─ getPendingPayouts()                                 │   │
│  │  └─ calculateCommissionRate()                           │   │
│  │                                                          │   │
│  │  userManagementService.js (Admin)                       │   │
│  │  ├─ getAllUsers()                                       │   │
│  │  ├─ suspendUser()                                       │   │
│  │  ├─ activateUser()                                      │   │
│  │  └─ deleteUser()                                        │   │
│  │                                                          │   │
│  │  errorHandler.js                                        │   │
│  │  └─ getErrorMessage() ← User-friendly errors            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                    │
│                      Uses:                                      │
│                      ↓                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         SUPABASE CLIENT (API Connector)                  │   │
│  │         src/utils/supabaseClient.js                      │   │
│  │                                                          │   │
│  │  const supabase = createClient(URL, ANON_KEY)           │   │
│  │                                                          │   │
│  │  Handles:                                               │   │
│  │  ├─ Authentication (Supabase Auth)                      │   │
│  │  ├─ Database queries (PostgreSQL via Supabase)          │   │
│  │  └─ Real-time subscriptions (optional)                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓ (HTTPS)                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE BACKEND                           │
│                    (Backend as a Service)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          AUTHENTICATION & AUTHORIZATION                  │   │
│  │                                                          │   │
│  │  - JWT token generation                                 │   │
│  │  - Session management                                   │   │
│  │  - Password hashing                                     │   │
│  │  - Multi-user support                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           PostgreSQL DATABASE (3 Tables)                 │   │
│  │                                                          │   │
│  │  ┌─────────────────┐   ┌─────────────────┐             │   │
│  │  │ USERS TABLE     │   │ LEADS TABLE     │             │   │
│  │  ├─────────────────┤   ├─────────────────┤             │   │
│  │  │ id (PK)         │   │ id (PK)         │             │   │
│  │  │ name            │   │ user_id (FK)────┼─→ id       │   │
│  │  │ email (unique)  │   │ client_name     │             │   │
│  │  │ role            │   │ phone           │             │   │
│  │  │ designation     │   │ service         │             │   │
│  │  │ status          │   │ status          │             │   │
│  │  │ created_at      │   │ created_at      │             │   │
│  │  └─────────────────┘   └─────────────────┘             │   │
│  │           ↑                                             │   │
│  │           └─ 1-to-Many relationship                   │   │
│  │                                                        │   │
│  │  ┌─────────────────────────────────────┐              │   │
│  │  │ EARNINGS TABLE                      │              │   │
│  │  ├─────────────────────────────────────┤              │   │
│  │  │ id (PK)                             │              │   │
│  │  │ user_id (FK)─────→ users.id         │              │   │
│  │  │ amount                              │              │   │
│  │  │ commission (calculated: 10% or 15%) │              │   │
│  │  │ payout_status (pending/paid)        │              │   │
│  │  │ created_at                          │              │   │
│  │  └─────────────────────────────────────┘              │   │
│  │                                                        │   │
│  │  Row-Level Security (RLS):                            │   │
│  │  - Users see only their own data                      │   │
│  │  - Admins can see everything                          │   │
│  │  - Cascading deletes prevent orphans                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### User Authentication Flow

```
User Opens App
    ↓
App loads AuthContext
    ↓
Check: Is user session stored?
    ├─ YES → Restore user state
    │         ↓
    │         User logged in ✅
    │
    └─ NO → User not logged in
             ↓
             Show Login page

User enters email & password
    ↓
AuthContext.login(email, password)
    ↓
authService.loginUser(email, password)
    ↓
supabaseClient.signInWithPassword()
    ↓
Supabase Auth validates
    ├─ Invalid → Error message
    │
    └─ Valid → Get JWT token
               ↓
               Fetch user from users table
               ↓
               Check: Is suspended?
               ├─ YES → Error: "Account suspended"
               │
               └─ NO → AuthContext updates
                       User is logged in ✅
```

### Lead Management Flow

```
User creates lead
    ↓
LeadsPage.jsx calls createLead()
    ↓
useLeads hook receives call
    ↓
leadService.addLead()
    ↓
supabaseClient.from('leads').insert()
    ↓
Supabase INSERT into leads table
    ├─ Checks: user_id matches current user
    ├─ Validates: All required fields present
    └─ Sets: created_at timestamp
                ↓
Lead added ✅
    ↓
Local state updates
    ↓
UI re-renders with new lead
```

### Commission Calculation Flow

```
User marks lead as CONVERTED
    ↓
LeadsPage.jsx calls updateStatus()
    ↓
leadService.updateLeadStatus(leadId, 'converted')
    ↓
supabaseClient.from('leads').update()
    ↓
Status changes to 'converted'
    ↓
(In real app) Trigger function calculates commission
    ↓
Commission added to earnings table
    ├─ Amount: sale amount
    ├─ Commission: 10% OR 15% (based on total conversions)
    └─ Status: pending
    ↓
User sees in Earnings page ✅
    ↓
When admin marks as 'paid'
    ↓
Status: pending → paid
    ↓
Earnings page updates
```

### Admin User Management Flow

```
Admin clicks "Suspend" on user
    ↓
AdminPage.jsx calls suspendUser(userId)
    ↓
userManagementService.suspendUser()
    ↓
supabaseClient.from('users').update()
    ├─ Sets: status = 'suspended'
    └─ Where: id = userId
                ↓
Suspended user's status = 'suspended' ✅
    ↓
Later: Suspended user tries to login
    ↓
authService.loginUser()
    ↓
Gets user from users table
    ↓
Checks: user.status === 'suspended'?
    ├─ YES → logoutUser() immediately
    │        Error: "Your account has been suspended"
    │
    └─ NO → Allow login

Admin clicks "Activate"
    ↓
userManagementService.activateUser()
    ↓
Status = 'active'
    ↓
User can login again ✅
```

---

## Component Hierarchy

```
App
├─ AuthContext.Provider
│  └─ BrowserRouter
│     ├─ Routes
│     │  ├─ PublicPage (LoginPage, SignupPage)
│     │  │  └─ Form Component
│     │  │     └─ Input, Button Components
│     │  │
│     │  ├─ ProtectedRoute
│     │  │  ├─ DashboardLayout
│     │  │  │  ├─ Sidebar
│     │  │  │  │  └─ Navigation Links
│     │  │  │  │
│     │  │  │  └─ Route Pages
│     │  │  │     ├─ DashboardPage
│     │  │  │     │  └─ StatCard Component
│     │  │  │     │
│     │  │  │     ├─ LeadsPage
│     │  │  │     │  ├─ Modal (add lead)
│     │  │  │     │  ├─ Input, Button
│     │  │  │     │  └─ StatusBadge
│     │  │  │     │
│     │  │  │     ├─ LeaderboardPage
│     │  │  │     │  ├─ Top 3 Podium
│     │  │  │     │  ├─ Avatar
│     │  │  │     │  └─ Full Rankings Table
│     │  │  │     │
│     │  │  │     ├─ EarningsPage
│     │  │  │     │  ├─ StatCard (3x)
│     │  │  │     │  └─ Transaction Table
│     │  │  │     │
│     │  │  │     ├─ ProfilePage
│     │  │  │     │  └─ Avatar, Button
│     │  │  │     │
│     │  │  │     └─ AdminPage
│     │  │  │        ├─ Stats Cards (3x)
│     │  │  │        └─ Users Table
│     │  │  │           └─ Suspend/Activate/Delete Buttons
```

---

## State Management

```
Global State (AuthContext)
├─ currentUser (object)
│  ├─ id (UUID)
│  ├─ name (string)
│  ├─ email (string)
│  ├─ role (enum: admin|manager|freelancer)
│  ├─ designation (string)
│  └─ status (enum: active|suspended)
│
├─ isAuthenticated (boolean)
├─ loading (boolean)
├─ isAdmin (computed)
├─ isManager (computed)
└─ isFreelancer (computed)

Page-Level State (useState)
├─ LeadsPage
│  ├─ leads (array)
│  ├─ filteredLeads (array)
│  ├─ searchQuery (string)
│  ├─ filterStatus (string)
│  └─ loading (boolean)
│
├─ LeaderboardPage
│  ├─ leaderboard (array)
│  ├─ userRank (number)
│  └─ loading (boolean)
│
├─ EarningsPage
│  ├─ earnings (array)
│  ├─ totals (object)
│  └─ loading (boolean)
│
└─ AdminPage
   ├─ users (array)
   ├─ stats (object)
   └─ loading (boolean)
```

---

## API Endpoints (via Supabase)

```
Authentication
├─ POST   /auth/v1/signup              (Create account)
├─ POST   /auth/v1/token?grant_type... (Login)
└─ POST   /auth/v1/logout              (Logout)

Users Table
├─ GET    /rest/v1/users               (Get all)
├─ GET    /rest/v1/users?id=...        (Get one)
├─ POST   /rest/v1/users               (Create)
├─ PATCH  /rest/v1/users?id=...        (Update)
└─ DELETE /rest/v1/users?id=...        (Delete)

Leads Table
├─ GET    /rest/v1/leads?user_id=...   (Get user's leads)
├─ POST   /rest/v1/leads               (Create lead)
├─ PATCH  /rest/v1/leads?id=...        (Update lead)
└─ DELETE /rest/v1/leads?id=...        (Delete lead)

Earnings Table
├─ GET    /rest/v1/earnings?user_id=...  (Get earnings)
├─ POST   /rest/v1/earnings              (Create earning)
└─ PATCH  /rest/v1/earnings?id=...       (Update earning)

All requests include:
├─ Authorization: Bearer {JWT_TOKEN}
├─ Content-Type: application/json
└─ apikey: {ANON_KEY}
```

---

## Environment Variables

```
.env file
├─ REACT_APP_SUPABASE_URL
│  └─ Your Supabase project URL
│     (example: https://abcdef.supabase.co)
│
└─ REACT_APP_SUPABASE_ANON_KEY
   └─ Your Supabase anonymous public key
      (long string starting with eyJ...)

These are:
✅ NOT sensitive (used client-side)
✅ Required for app to work
✅ Environment-specific (staging vs prod)
❌ NOT your service role key (never expose this!)
```

---

## Deployment Flow

```
Development
    ↓
npm start
    ↓
Local Supabase (dev) project
    ↓
Test all features
    ↓
       ↓
    TEST ✅
       ↓
npm run build
    ↓
Creates optimized build/ folder
    ↓
Deploy to Vercel/Netlify
    ├─ Set environment variables
    ├─ Point to production Supabase project
    └─ Deploy
       ↓
Production
    ↓
https://your-domain.com
    ↓
HTTPS connection to production Supabase
    ↓
LIVE ✅
```

---

## Security Model

```
Client-Side (React App)
├─ Validates user input
├─ Shows "Access Denied" for non-admins
├─ Stores JWT in browser localStorage
└─ Sends JWT with each request

Server-Side (Supabase)
├─ Validates JWT token
├─ Enforces Row-Level Security (RLS)
│  ├─ Users can only see own data
│  ├─ Admins can see all data
│  └─ Suspended users can't do anything
├─ Validates all SQL queries
├─ Encrypts passwords
└─ Logs all access

Database (PostgreSQL)
├─ Foreign key constraints
├─ Cascading deletes
├─ NOT NULL constraints
├─ Unique constraints
└─ Check constraints (status in valid values)
```

---

**This architecture ensures your app is scalable, secure, and maintainable! 🚀**
