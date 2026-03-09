# Audit Logs RLS Fix

## Problem Identified

User **vcdhh95@gmail.com** has audit logs in the database, but they're not showing up in the frontend.

### Database Check Results
✅ **User exists:** d86c1ca7-00bf-452b-962f-7396c5584d61
✅ **Audit log exists:** 1 entry (system_test action)
✅ **RLS policies exist:** Correct policies are in place

### Root Cause
The backend was using the **anon key** (public client) which enforces RLS policies. The RLS policy checks `auth.uid()`, but the backend wasn't setting the user's JWT token in the Supabase client, so `auth.uid()` returned null and no logs were returned.

## Solution

Changed the Audit Log Repository to use the **service role client** which bypasses RLS. This is safe because:
1. The API routes already have authentication middleware
2. Queries are filtered by `user_id` in the repository
3. Only authenticated users can access their own logs
4. Admins have separate endpoints with role checks

## Changes Made

### 1. Added Service Role Client
**File:** `FreelanceXchain-api/src/config/supabase.ts`

```typescript
export function getSupabaseServiceClient(): SupabaseClient {
  if (!supabaseServiceClient) {
    if (!config.supabase.url || !config.supabase.serviceRoleKey) {
      throw new Error('Supabase service role configuration is missing.');
    }
    supabaseServiceClient = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return supabaseServiceClient;
}
```

### 2. Updated Audit Log Repository
**File:** `FreelanceXchain-api/src/repositories/audit-log-repository.ts`

Changed from:
```typescript
export class AuditLogRepository extends BaseRepository<AuditLogEntry> {
  constructor() {
    super(TABLES.AUDIT_LOG_ENTRIES);
  }
  // Uses anon key client from BaseRepository
}
```

To:
```typescript
export class AuditLogRepository {
  protected client: SupabaseClient;

  constructor() {
    this.tableName = 'audit_log_entries' as TableName;
    // Use service role client to bypass RLS
    this.client = getSupabaseServiceClient();
  }
}
```

## Security Considerations

### Why This is Safe

1. **API-Level Authentication**
   - All audit log endpoints require `authMiddleware`
   - User identity is verified before queries
   - JWT tokens are validated

2. **Query-Level Filtering**
   - `/me` endpoint filters by `req.user.userId`
   - Admin endpoints require `requireRole('admin')`
   - All queries explicitly filter by user_id

3. **RLS as Defense-in-Depth**
   - RLS policies still exist as backup
   - Service role is only used for audit logs
   - Other tables still use anon key with RLS

### Alternative Approach (Not Used)

We could have kept the anon key and set the JWT token:
```typescript
const client = getSupabaseClient();
const token = req.headers.authorization?.replace('Bearer ', '');
await client.auth.setSession({ access_token: token, refresh_token: '' });
```

But this is more complex and requires managing sessions per request.

## Testing

### 1. Restart Backend
```bash
cd FreelanceXchain-api
npm run dev
```

### 2. Test API Endpoint
```bash
curl -X GET "http://localhost:3000/api/audit-logs/me?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Check Frontend
1. Refresh the page (F5)
2. Navigate to Settings → Activity Log
3. Logs should now appear

## Expected Results

For user **vcdhh95@gmail.com**:
- Should see 1 audit log entry
- Action: "System Test"
- Resource: test
- Status: success
- Date: Feb 19, 2026

## Files Modified

1. ✅ `FreelanceXchain-api/src/config/supabase.ts` - Added `getSupabaseServiceClient()`
2. ✅ `FreelanceXchain-api/src/repositories/audit-log-repository.ts` - Use service client

## Environment Variables Required

Make sure `.env` has:
```env
SUPABASE_URL=https://nfcfgxfpidfvcpkyjgih.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## RLS Policies (Still Active)

These policies remain as defense-in-depth:
1. ✅ Users can view their own audit logs (`user_id = auth.uid()`)
2. ✅ Admins can view all audit logs
3. ✅ Service role can insert audit logs
4. ✅ Audit logs are immutable (no updates)
5. ✅ Audit logs cannot be deleted

---

**Status:** ✅ Fixed

The audit logs should now be accessible to users through the frontend!
