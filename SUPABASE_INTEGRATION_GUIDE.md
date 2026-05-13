# Expert Arena — Supabase Integration Guide

A fully-functional React SaaS dashboard for freelancers with real-time Supabase backend integration.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Supabase account (free at https://supabase.com)

### Step 1: Install Dependencies

```bash
npm install
```

The Supabase package is already installed. Check `package.json` to verify `@supabase/supabase-js` is listed.

### Step 2: Get Your Supabase Credentials

1. Go to https://app.supabase.com/
2. Create a new project or select existing
3. Click **Settings** → **API** tab
4. Copy these two values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (long string)

### Step 3: Configure Environment Variables

Create/Update `.env` file in project root:

```env
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

⚠️ **Never commit `.env` to Git!** It contains secrets.

### Step 4: Verify Supabase Connection

Start the app:
```bash
npm start
```

Open browser console (F12) and look for:
- ✅ `✅ Supabase connection successful!` = All good!
- ❌ Error = Check your `.env` file

Once verified, remove the test code from `src/App.js`.

---

## 📊 Database Schema

### Table: `users`
Stores user profiles and authentication data.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary Key, auto-generated |
| `name` | Text | User's full name |
| `email` | Text | Unique email |
| `role` | Text | `freelancer` \| `manager` \| `admin` |
| `designation` | Text | Job title |
| `status` | Text | `active` \| `suspended` |
| `created_at` | Timestamp | Auto-set to `now()` |

### Table: `leads`
Stores client leads for each user.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary Key |
| `user_id` | UUID | Foreign Key → `users.id` |
| `client_name` | Text | Client name |
| `phone` | Text | Contact number |
| `service` | Text | Service type |
| `status` | Text | `pending` \| `follow-up` \| `converted` |
| `created_at` | Timestamp | Auto-set |

### Table: `earnings`
Tracks commissions and payouts.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary Key |
| `user_id` | UUID | Foreign Key → `users.id` |
| `amount` | Numeric | Sale amount |
| `commission` | Numeric | Commission earned (10-15%) |
| `payout_status` | Text | `pending` \| `paid` \| `rejected` |
| `created_at` | Timestamp | Auto-set |

---

## 🏗️ Folder Structure

```
src/
├── components/              # Reusable UI components
│   ├── Avatar.jsx
│   ├── Button.jsx
│   ├── Input.jsx
│   ├── Modal.jsx
│   ├── ProtectedRoute.jsx   # Role-based access control
│   ├── StatusBadge.jsx
│   └── StatCard.jsx
│
├── constants/               # App-wide constants
│   └── appConstants.js      # Roles, statuses, messages
│
├── context/                 # React Context
│   └── AuthContext.jsx      # Global auth state
│
├── data/                    # Mock data (remove after testing)
│   └── mockData.js
│
├── hooks/                   # Custom React hooks
│   ├── useLeads.js          # Lead management
│   └── useEarnings.js       # Earnings management
│
├── layouts/                 # Page layouts
│   ├── DashboardLayout.jsx
│   └── Sidebar.jsx
│
├── pages/                   # Page components
│   ├── AdminPage.jsx        # User management (admin only)
│   ├── DashboardPage.jsx
│   ├── EarningsPage.jsx     # Commission tracking
│   ├── LeaderboardPage.jsx  # Rankings
│   ├── LeadsPage.jsx        # Lead management
│   ├── LoginPage.jsx
│   ├── ProfilePage.jsx
│   └── SignupPage.jsx
│
├── utils/                   # Utility functions & services
│   ├── authService.js       # Auth operations
│   ├── errorHandler.js      # Error handling
│   ├── earningsService.js   # Earnings queries
│   ├── leadService.js       # Lead operations
│   ├── leaderboardService.js # Leaderboard logic
│   ├── supabaseClient.js    # Supabase client setup
│   ├── supabaseTest.js      # Connection test
│   └── userManagementService.js # Admin functions
│
├── App.js                   # Main app component
├── App.css                  # Tailwind styles
├── index.js                 # Entry point
└── supabaseClient.js        # Exported Supabase client

.env                         # Environment variables (NOT in Git)
package.json
```

---

## 🔐 Authentication Flow

### Signup
1. User enters name, email, password
2. `signupUser()` creates auth account in Supabase Auth
3. User profile is created in `users` table
4. Link both with same `id`
5. User is automatically logged in

### Login
1. User enters email & password
2. `loginUser()` authenticates with Supabase Auth
3. Fetches user profile from `users` table
4. Checks if account is `suspended`
   - If suspended → logged out immediately
   - If active → session created
5. AuthContext updates global state

### Session Persistence
- `onAuthStateChange()` listens for auth changes
- Even after page refresh, user stays logged in
- Works across browser tabs
- Session expires after inactivity (default: 1 hour)

---

## 👥 Role-Based Access Control

### Roles Available
- **freelancer** — Regular user, can manage leads & earnings
- **manager** — Elevated permissions (for future use)
- **admin** — Full access including user management

### Protected Pages
- `AdminPage` — Only admins can access
  - Non-admins see "Access Denied" message
  - Sidebar hides Admin Panel for non-admins

### Usage
```jsx
<ProtectedRoute requiredRole="admin">
  <AdminPage />
</ProtectedRoute>
```

---

## 📝 Lead Management

### Create Lead
```javascript
const { lead, error } = await addLead({
  client_name: 'Acme Corp',
  phone: '+91 9876543210',
  service: 'Web Development',
  status: 'pending'
}, userId);
```

### Fetch User's Leads
```javascript
const { leads, error } = await getUserLeads(userId);
```

### Update Lead Status
```javascript
await updateLeadStatus(leadId, 'converted');
```

### Delete Lead
```javascript
await deleteLead(leadId);
```

---

## 💰 Earnings System

### Commission Calculation
- **Base rate**: 10% of sale amount
- **Premium rate**: 15% for users with 10+ conversions
- Auto-calculated when lead is marked `converted`

### Earnings States
- **Total Earnings** — Sum of all amounts
- **Pending Payouts** — Not yet paid
- **Paid Payouts** — Already received

### Admin Functions
- View all user earnings
- Mark payout as `paid` or `rejected`
- Generate payout reports

---

## 🏆 Leaderboard

### Ranking Logic
1. Count converted leads per user
2. Sort by highest count (descending)
3. Assign ranks 1, 2, 3...

### Display
- **Top 3** — Special podium view with medals
- **Full Table** — All users with progress bars
- **Current User** — Highlighted with "You" badge

---

## ⚠️ User Suspension

### How It Works
1. Admin clicks "Suspend" on user row
2. User's status → `suspended`
3. Suspended user tries to login
   - Password accepted, but account check fails
   - Session immediately ended
   - Error: "Your account has been suspended"

### Reactivation
Admin clicks "Activate" to set status → `active`
User can login again immediately.

---

## 🛠️ Development

### Start Dev Server
```bash
npm start
```
Opens http://localhost:3000

### Build for Production
```bash
npm run build
```
Creates optimized build in `build/` folder

### Run Tests
```bash
npm test
```

---

## 📚 Using Custom Hooks

### useLeads Hook
```javascript
const { leads, loading, error, fetchLeads, createLead } = useLeads(userId);

// Fetch leads
await fetchLeads();

// Add new lead
const { success } = await createLead({
  client_name: 'ABC Corp',
  phone: '9876543210',
  service: 'Consulting',
  status: 'pending'
});
```

### useEarnings Hook
```javascript
const { earnings, totals, loading, refetch } = useEarnings(userId);

console.log(totals.total);      // Total earnings
console.log(totals.pending);    // Pending payouts
console.log(totals.paid);       // Paid amount
```

---

## 🚨 Error Handling

All services return consistent error objects:

```javascript
const { data, error } = await someFunction();

if (error) {
  console.error('Operation failed:', error);
  // Handle error gracefully
}
```

Use `errorHandler.js` for user-friendly messages:
```javascript
import { getErrorMessage } from '../utils/errorHandler';

const userMessage = getErrorMessage(error);
// Returns: "Invalid email or password"
```

---

## 🔒 Security Best Practices

### Implemented
✅ Row-Level Security (RLS) on database tables
✅ Protected routes with role checks
✅ Suspended users can't login
✅ Environment variables for secrets
✅ Sessions expire after inactivity

### To Add Later
- Email verification on signup
- Two-factor authentication
- Rate limiting on API calls
- Audit logs for admin actions
- Data encryption at rest

---

## 🐛 Troubleshooting

### "Supabase connection failed"
- [ ] Check `.env` file exists
- [ ] Verify `REACT_APP_SUPABASE_URL` is correct
- [ ] Verify `REACT_APP_SUPABASE_ANON_KEY` is correct
- [ ] Restart dev server after changing `.env`

### "Invalid email or password"
- [ ] Ensure user exists in Supabase
- [ ] Check email is correct
- [ ] Verify password is at least 6 characters

### "Your account has been suspended"
- [ ] Admin needs to activate user in Admin Panel
- [ ] Check user status in Supabase dashboard

### Leads not loading
- [ ] Check user is authenticated
- [ ] Verify leads table exists in Supabase
- [ ] Check browser console for errors

---

## 📞 Support

For Supabase documentation:
- https://supabase.com/docs
- https://supabase.com/docs/reference/javascript

For React documentation:
- https://react.dev

---

## 📄 License

This project is open source and available under the MIT License.

---

**Happy coding! 🚀**
