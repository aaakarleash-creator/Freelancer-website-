// File: QUICK_REFERENCE.md
// Purpose: One-page quick reference for common tasks

# Expert Arena - Quick Reference Card

## 🚀 Start App
```bash
npm start
# Opens http://localhost:3000
```

## 📋 Before First Run
1. Create `.env` in project root:
   ```env
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your_key_here
   ```
2. Get credentials from https://app.supabase.com → Settings → API

## 🔓 User Roles
- `freelancer` — Regular user
- `manager` — Elevated (for future)
- `admin` — Full access

## 📊 Lead Statuses
- `pending` — New lead
- `follow-up` — Following up
- `converted` — Became customer

## 💳 Payout Statuses
- `pending` — Not paid yet
- `paid` — Already paid
- `rejected` — Rejected payout

## 💰 Commission Rates
- **10%** — Base rate (default)
- **15%** — Premium (10+ conversions)

---

## 🔧 Common Code Snippets

### Use Auth Context
```javascript
import { useAuth } from '../context/AuthContext';

const { currentUser, isAdmin, login, logout } = useAuth();
```

### Fetch Leads
```javascript
import { useLeads } from '../hooks/useLeads';

const { leads, createLead, updateStatus } = useLeads(userId);
```

### Fetch Earnings
```javascript
import { useEarnings } from '../hooks/useEarnings';

const { totals, earnings } = useEarnings(userId);
console.log(totals.total);    // Total earnings
console.log(totals.pending);  // Pending payouts
```

### Add Lead
```javascript
const { success } = await createLead({
  client_name: 'ABC Corp',
  phone: '9876543210',
  service: 'Consulting',
  status: 'pending'
});
```

### Update Lead Status
```javascript
await updateStatus(leadId, 'converted');
```

### Get User Rank
```javascript
import { getUserRank } from '../utils/leaderboardService';

const { rank, convertedLeads } = await getUserRank(userId);
```

### Get All Users (Admin)
```javascript
import { getAllUsers } from '../utils/userManagementService';

const { users } = await getAllUsers();
```

### Suspend User (Admin)
```javascript
import { suspendUser } from '../utils/userManagementService';

await suspendUser(userId);
```

### Check Role
```javascript
const { currentUser } = useAuth();

if (currentUser?.role === 'admin') {
  // Show admin features
}
```

---

## 📂 File Locations

| Feature | File |
|---------|------|
| Authentication | `src/utils/authService.js` |
| Leads | `src/utils/leadService.js` + `src/hooks/useLeads.js` |
| Leaderboard | `src/utils/leaderboardService.js` |
| Earnings | `src/utils/earningsService.js` + `src/hooks/useEarnings.js` |
| Admin | `src/utils/userManagementService.js` |
| Constants | `src/constants/appConstants.js` |
| Error Handling | `src/utils/errorHandler.js` |
| Supabase Client | `src/utils/supabaseClient.js` |
| Auth Context | `src/context/AuthContext.jsx` |
| Protected Routes | `src/components/ProtectedRoute.jsx` |

---

## 🧪 Testing

### Check Connection
Open browser console (F12), should see:
```
✅ Supabase connection successful!
```

### Test Signup
1. Go to http://localhost:3000/signup
2. Enter name, email, password (6+ chars)
3. Click "Sign Up"
4. Check user appears in Supabase dashboard

### Test Login
1. Go to http://localhost:3000/login
2. Enter email and password
3. Should redirect to dashboard

### Test Session Persistence
1. Login
2. Refresh page (F5)
3. Should still be logged in ✓

---

## 🔐 Database Tables

### users
```sql
id (UUID)
name (Text)
email (Text) - unique
role (Text) - freelancer|manager|admin
designation (Text)
status (Text) - active|suspended
created_at (Timestamp)
```

### leads
```sql
id (UUID)
user_id (UUID) → users.id
client_name (Text)
phone (Text)
service (Text)
status (Text) - pending|follow-up|converted
created_at (Timestamp)
```

### earnings
```sql
id (UUID)
user_id (UUID) → users.id
amount (Numeric)
commission (Numeric)
payout_status (Text) - pending|paid|rejected
created_at (Timestamp)
```

---

## ⚡ Import Examples

```javascript
// Auth
import { loginUser, signupUser, logoutUser, getCurrentUser } from '../utils/authService';

// Leads
import { addLead, getUserLeads, updateLeadStatus, deleteLead } from '../utils/leadService';
import { useLeads } from '../hooks/useLeads';

// Leaderboard
import { getLeaderboard, getUserRank, getTopPerformers } from '../utils/leaderboardService';

// Earnings
import { getUserEarnings, calculateTotalEarnings, getPendingPayouts } from '../utils/earningsService';
import { useEarnings } from '../hooks/useEarnings';

// Admin
import { getAllUsers, suspendUser, activateUser, deleteUser } from '../utils/userManagementService';

// Context
import { useAuth } from '../context/AuthContext';

// Constants
import { USER_ROLES, LEAD_STATUS, COMMISSION_RATES } from '../constants/appConstants';

// Error Handling
import { getErrorMessage } from '../utils/errorHandler';
```

---

## 🚨 Error Handling

All functions return:
```javascript
{ data/result, error }
```

Always check error:
```javascript
const { leads, error } = await getUserLeads(userId);
if (error) {
  const userMessage = getErrorMessage(error);
  console.error(userMessage);
}
```

---

## 🔑 Key Functions

| Function | What It Does |
|----------|-------------|
| `signupUser()` | Create new account |
| `loginUser()` | Authenticate user |
| `logoutUser()` | End session |
| `addLead()` | Create new lead |
| `getUserLeads()` | Fetch user's leads |
| `updateLeadStatus()` | Change lead status |
| `getLeaderboard()` | Get user rankings |
| `getUserEarnings()` | Fetch earnings |
| `getAllUsers()` | Get all users (admin) |
| `suspendUser()` | Suspend user (admin) |

---

## 📱 Page Routes

| Route | File | Access |
|-------|------|--------|
| `/login` | LoginPage.jsx | Anyone |
| `/signup` | SignupPage.jsx | Anyone |
| `/` | DashboardPage.jsx | Logged in |
| `/leads` | LeadsPage.jsx | Logged in |
| `/leaderboard` | LeaderboardPage.jsx | Logged in |
| `/earnings` | EarningsPage.jsx | Logged in |
| `/profile` | ProfilePage.jsx | Logged in |
| `/admin` | AdminPage.jsx | Admin only |

---

## 🎯 Full Workflow

```
User Signs Up
   ↓
Enters name, email, password
   ↓
Account created in Supabase Auth
   ↓
Profile created in users table
   ↓
Auto-logged in
   ↓
Can add leads
   ↓
Can mark leads as converted
   ↓
Rank updates in leaderboard
   ↓
Commission calculated (10-15%)
   ↓
Earnings visible in earnings page
   ↓
Admin can process payouts
```

---

## 💾 Save & Deploy

### Before Deploying
- [ ] Fill .env with production credentials
- [ ] Remove test code from App.js
- [ ] Test all features work
- [ ] Build: `npm run build`

### Deploy To
- Vercel: `vercel deploy`
- Netlify: Push to Git
- Other: Upload `build/` folder

---

## 📚 Full Documentation

| Document | What It Contains |
|----------|-----------------|
| GETTING_STARTED.md | Overview and setup |
| SUPABASE_INTEGRATION_GUIDE.md | Complete guide |
| API_REFERENCE.md | All function docs |
| IMPLEMENTATION_CHECKLIST.md | Verification steps |
| QUICK_REFERENCE.md | This file |

---

## ❓ Common Tasks

### Add new user role
1. Update `USER_ROLES` in `src/constants/appConstants.js`
2. Update database `users` table schema
3. Update `ProtectedRoute.jsx` if needed

### Change commission rates
Edit `src/constants/appConstants.js`:
```javascript
COMMISSION_RATES = {
  BASE: 10,      // Change this
  PREMIUM: 15,   // Or this
  PREMIUM_THRESHOLD: 10
}
```

### Add new lead status
Edit `src/constants/appConstants.js`:
```javascript
LEAD_STATUS = {
  PENDING: 'pending',
  FOLLOW_UP: 'follow-up',
  CONVERTED: 'converted',
  NEW_STATUS: 'new_status'  // Add here
}
```

### Add new page
1. Create file: `src/pages/NewPage.jsx`
2. Create component with sidebar in layout
3. Add route in App.js
4. Add link to Sidebar.jsx

---

**For detailed info, see full documentation files! 📚**
