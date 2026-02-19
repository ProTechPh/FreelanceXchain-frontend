# Audit Logs - Complete Solution

## Problem Found

May **2 different audit log tables**:

1. **`auth.audit_log_entries`** (Supabase built-in)
   - Automatic logging ng Supabase Auth events
   - Contains: login, logout, token_refreshed, token_revoked, MFA events
   - ✅ Already working and populated
   - ❌ Hindi accessible sa backend API (auth schema)

2. **`public.audit_log_entries`** (Custom app logs)
   - Para sa custom application events
   - Should contain: contract actions, payments, disputes, etc.
   - ❌ Table doesn't exist yet!
   - ❌ No logging middleware implemented

## Current Situation

### What's in Supabase (auth.audit_log_entries)
For user **vcdhh95@gmail.com**:
- ✅ 20+ login events
- ✅ MFA events (factor_unenrolled, verification_attempted, challenge_created)
- ✅ Token events (token_revoked, token_refreshed)
- ✅ IP addresses logged

### What's Missing (public.audit_log_entries)
- ❌ Table doesn't exist
- ❌ No custom app logging
- ❌ Frontend shows "No activity logs found"

## Solution

### Step 1: Create public.audit_log_entries Table

```sql
-- Create audit log entries table in public schema
CREATE TABLE IF NOT EXISTS public.audit_log_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  actor_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  payload JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failure', 'pending')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_audit_logs_user_id ON public.audit_log_entries(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_log_entries(action);
CREATE INDEX idx_audit_logs_resource ON public.audit_log_entries(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_log_entries(created_at DESC);
CREATE INDEX idx_audit_logs_status ON public.audit_log_entries(status);

-- Enable RLS
ALTER TABLE public.audit_log_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own audit logs"
  ON public.audit_log_entries
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all audit logs"
  ON public.audit_log_entries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Service role can insert audit logs"
  ON public.audit_log_entries
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Audit logs are immutable"
  ON public.audit_log_entries
  FOR UPDATE
  USING (false);

CREATE POLICY "Audit logs cannot be deleted"
  ON public.audit_log_entries
  FOR DELETE
  USING (false);
```

### Step 2: Add Audit Logging to Auth Routes

The auth routes need to call `logAuditEvent()` after successful operations.

**Example for login:**
```typescript
// After successful login
await logAuditEvent(req, {
  action: AUDITABLE_ACTIONS.LOGIN,
  resourceType: 'auth',
  status: 'success',
});
```

**Example for logout:**
```typescript
// After successful logout
await logAuditEvent(req, {
  action: AUDITABLE_ACTIONS.LOGOUT,
  resourceType: 'auth',
  status: 'success',
});
```

### Step 3: Option - Sync Auth Logs to Public Schema

We can create a function to copy relevant auth logs to public schema:

```sql
-- Function to sync auth logs to public audit logs
CREATE OR REPLACE FUNCTION sync_auth_audit_logs()
RETURNS void AS $$
BEGIN
  INSERT INTO public.audit_log_entries (
    user_id,
    actor_id,
    action,
    resource_type,
    ip_address,
    created_at,
    status
  )
  SELECT 
    (payload->>'actor_id')::UUID as user_id,
    payload->>'actor_id' as actor_id,
    CASE 
      WHEN payload->>'action' = 'login' THEN 'user_login'
      WHEN payload->>'action' = 'logout' THEN 'user_logout'
      WHEN payload->>'action' = 'token_refreshed' THEN 'token_refreshed'
      WHEN payload->>'action' = 'token_revoked' THEN 'token_revoked'
      ELSE payload->>'action'
    END as action,
    'auth' as resource_type,
    ip_address::INET,
    created_at,
    'success' as status
  FROM auth.audit_log_entries
  WHERE payload->>'action' IN ('login', 'logout', 'token_refreshed', 'token_revoked')
  AND (payload->>'actor_id')::UUID IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.audit_log_entries pal
    WHERE pal.actor_id = auth.audit_log_entries.payload->>'actor_id'
    AND pal.created_at = auth.audit_log_entries.created_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Implementation Steps

1. **Run the migration** to create `public.audit_log_entries` table
2. **Sync existing auth logs** (optional) using the sync function
3. **Add audit logging** to auth routes (login, logout, register)
4. **Test** - Login/logout should now appear in activity log

## Files to Modify

1. Create migration file: `FreelanceXchain-api/supabase/migrations/XXXXXX_create_audit_logs.sql`
2. Update: `FreelanceXchain-api/src/routes/auth-routes.ts` - Add logAuditEvent calls
3. Backend already has:
   - ✅ Audit log repository
   - ✅ Audit log service
   - ✅ Audit log routes
   - ✅ Frontend API client method

## Quick Fix (Immediate)

Run this SQL in Supabase to sync existing auth logs:

```sql
-- Create table
CREATE TABLE IF NOT EXISTS public.audit_log_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  actor_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  payload JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync auth logs
INSERT INTO public.audit_log_entries (
  user_id, actor_id, action, resource_type, ip_address, created_at, status
)
SELECT 
  (payload->>'actor_id')::UUID,
  payload->>'actor_id',
  CASE 
    WHEN payload->>'action' = 'login' THEN 'user_login'
    WHEN payload->>'action' = 'logout' THEN 'user_logout'
    ELSE payload->>'action'
  END,
  'auth',
  CASE WHEN ip_address = '' THEN NULL ELSE ip_address::INET END,
  created_at,
  'success'
FROM auth.audit_log_entries
WHERE payload->>'action' IN ('login', 'logout')
AND (payload->>'actor_id')::UUID IS NOT NULL;
```

After running this, refresh the frontend and the logs should appear!

---

**Status:** Solution identified - Need to create public.audit_log_entries table and sync/log auth events
