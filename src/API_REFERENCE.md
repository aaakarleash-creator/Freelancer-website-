// File: src/API_REFERENCE.md
// Purpose: Complete API reference for all service functions

# Expert Arena API Reference

## Authentication Service (`authService.js`)

### signupUser(email, password, userData)
Create new user account.

**Parameters:**
- `email` (string) — User email
- `password` (string) — Password (min 6 chars)
- `userData` (object) — `{ name, role, designation }`

**Returns:**
```javascript
{ user, error }
```

**Example:**
```javascript
const { user, error } = await signupUser('john@example.com', 'password123', {
  name: 'John Doe',
  role: 'freelancer',
  designation: 'Sales Expert'
});
```

---

### loginUser(email, password)
Authenticate existing user.

**Parameters:**
- `email` (string) — User email
- `password` (string) — User password

**Returns:**
```javascript
{ session, user, error, isSuspended }
```

**Example:**
```javascript
const { session, user, error } = await loginUser('john@example.com', 'password123');

if (error) {
  console.error('Login failed:', error);
}
```

---

### logoutUser()
End user session.

**Returns:**
```javascript
{ success, error }
```

---

### getCurrentUser()
Get current logged-in user.

**Returns:**
```javascript
{ user, error }
```

---

### onAuthStateChange(callback)
Listen to auth state changes (login/logout).

**Parameters:**
- `callback` (function) — Called with `{ user, session }`

**Returns:** Unsubscribe function

**Example:**
```javascript
const unsubscribe = onAuthStateChange((data) => {
  if (data.user) {
    console.log('User logged in:', data.user.name);
  } else {
    console.log('User logged out');
  }
});

// Clean up
unsubscribe();
```

---

## Lead Service (`leadService.js`)

### addLead(leadData, userId)
Create new lead.

**Parameters:**
- `leadData` (object) — `{ client_name, phone, service, status }`
- `userId` (string) — Current user ID

**Returns:**
```javascript
{ lead, error }
```

---

### getUserLeads(userId)
Get all leads for a user.

**Parameters:**
- `userId` (string) — User ID

**Returns:**
```javascript
{ leads: [], error }
```

---

### updateLeadStatus(leadId, newStatus)
Change lead status.

**Parameters:**
- `leadId` (string) — Lead ID
- `newStatus` (string) — `pending` | `follow-up` | `converted`

**Returns:**
```javascript
{ success, error }
```

---

### deleteLead(leadId)
Delete a lead.

**Parameters:**
- `leadId` (string) — Lead ID

**Returns:**
```javascript
{ success, error }
```

---

### getConvertedLeadsCount(userId)
Count converted leads for leaderboard.

**Parameters:**
- `userId` (string) — User ID

**Returns:**
```javascript
{ count, error }
```

---

## Leaderboard Service (`leaderboardService.js`)

### getLeaderboard()
Get all users ranked by converted leads.

**Returns:**
```javascript
{ 
  leaderboard: [
    { id, name, rank, convertedLeads, status, ... }
  ], 
  error 
}
```

---

### getUserRank(userId)
Get specific user's rank.

**Parameters:**
- `userId` (string) — User ID

**Returns:**
```javascript
{ rank, totalUsers, convertedLeads, error }
```

---

### getTopPerformers(limit)
Get top N performers.

**Parameters:**
- `limit` (number) — Default: 10

**Returns:**
```javascript
{ topPerformers: [], error }
```

---

## Earnings Service (`earningsService.js`)

### getUserEarnings(userId)
Get all earnings records.

**Parameters:**
- `userId` (string) — User ID

**Returns:**
```javascript
{ 
  earnings: [
    { id, user_id, amount, commission, payout_status, created_at }
  ],
  error 
}
```

---

### calculateTotalEarnings(userId)
Get total amount earned.

**Parameters:**
- `userId` (string) — User ID

**Returns:**
```javascript
{ total, error }
```

---

### calculateTotalCommission(userId)
Get total commission earned.

**Parameters:**
- `userId` (string) — User ID

**Returns:**
```javascript
{ totalCommission, error }
```

---

### getPendingPayouts(userId)
Get pending payouts.

**Parameters:**
- `userId` (string) — User ID

**Returns:**
```javascript
{ pendingAmount, count, error }
```

---

### getPaidPayouts(userId)
Get paid payouts.

**Parameters:**
- `userId` (string) — User ID

**Returns:**
```javascript
{ paidAmount, count, error }
```

---

### addEarnings(earningsData)
Create earnings record (admin).

**Parameters:**
- `earningsData` (object) — `{ user_id, amount, commission, payout_status }`

**Returns:**
```javascript
{ earning, error }
```

---

### updatePayoutStatus(earningId, newStatus)
Change payout status (admin).

**Parameters:**
- `earningId` (string) — Earning ID
- `newStatus` (string) — `pending` | `paid` | `rejected`

**Returns:**
```javascript
{ success, error }
```

---

### calculateCommissionRate(amount, convertedLeads)
Calculate commission amount.

**Parameters:**
- `amount` (number) — Sale amount
- `convertedLeads` (number) — User's total conversions

**Returns:**
```javascript
commissionAmount // number
```

**Logic:**
- 10% if convertedLeads < 10
- 15% if convertedLeads >= 10

---

## User Management Service (`userManagementService.js`)

### getAllUsers()
Get all users (admin only).

**Returns:**
```javascript
{ users: [], error }
```

---

### suspendUser(userId)
Suspend a user (admin only).

**Parameters:**
- `userId` (string) — User ID

**Returns:**
```javascript
{ success, error }
```

---

### activateUser(userId)
Reactivate suspended user (admin only).

**Parameters:**
- `userId` (string) — User ID

**Returns:**
```javascript
{ success, error }
```

---

### getUserStats()
Get user statistics.

**Returns:**
```javascript
{ 
  stats: {
    total,
    active,
    suspended,
    percentActive
  },
  error 
}
```

---

### updateUserRole(userId, newRole)
Change user role (admin only).

**Parameters:**
- `userId` (string) — User ID
- `newRole` (string) — `admin` | `manager` | `freelancer`

**Returns:**
```javascript
{ success, error }
```

---

### deleteUser(userId)
Delete user and all their data (admin only).

**Parameters:**
- `userId` (string) — User ID

**Returns:**
```javascript
{ success, error }
```

---

## Custom Hooks

### useLeads(userId)
Manage leads with automatic state management.

**Returns:**
```javascript
{
  leads,           // array of leads
  loading,         // boolean
  error,           // error string
  fetchLeads,      // async function
  createLead,      // async function
  updateStatus,    // async function
  removeLead       // async function
}
```

**Example:**
```javascript
const { leads, loading, createLead } = useLeads(userId);

const handleAddLead = async () => {
  const { success } = await createLead({
    client_name: 'New Corp',
    phone: '9876543210',
    service: 'Consulting',
    status: 'pending'
  });
};
```

---

### useEarnings(userId)
Manage earnings with automatic fetching.

**Returns:**
```javascript
{
  earnings,        // array of earnings
  totals: {        // object with totals
    total,
    pending,
    paid
  },
  loading,         // boolean
  error,           // error string
  refetch          // function to refresh
}
```

**Example:**
```javascript
const { totals, loading } = useEarnings(userId);

console.log(totals.total);  // Total earnings
```

---

## Error Handling

### getErrorMessage(error)
Convert error to user-friendly message.

**Parameters:**
- `error` (error object or string)

**Returns:**
```javascript
userFriendlyMessage // string
```

---

## Constants (`appConstants.js`)

### USER_ROLES
```javascript
{
  ADMIN: 'admin',
  MANAGER: 'manager',
  FREELANCER: 'freelancer'
}
```

### LEAD_STATUS
```javascript
{
  PENDING: 'pending',
  FOLLOW_UP: 'follow-up',
  CONVERTED: 'converted',
  REJECTED: 'rejected'
}
```

### COMMISSION_RATES
```javascript
{
  BASE: 10,           // 10%
  PREMIUM: 15,        // 15%
  PREMIUM_THRESHOLD: 10  // Need 10+ conversions
}
```

---

## Import Examples

```javascript
// Auth
import { loginUser, signupUser, logoutUser } from '../utils/authService';

// Leads
import { addLead, getUserLeads, updateLeadStatus } from '../utils/leadService';

// Leaderboard
import { getLeaderboard, getUserRank } from '../utils/leaderboardService';

// Earnings
import { getUserEarnings, calculateTotalEarnings } from '../utils/earningsService';

// Admin
import { getAllUsers, suspendUser } from '../utils/userManagementService';

// Hooks
import { useLeads } from '../hooks/useLeads';
import { useEarnings } from '../hooks/useEarnings';

// Context
import { useAuth } from '../context/AuthContext';

// Constants
import { USER_ROLES, LEAD_STATUS, COMMISSION_RATES } from '../constants/appConstants';
```

---

**All functions return consistent error objects: `{ data/result, error }`**

Check `error` to handle failures gracefully!
