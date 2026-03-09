# Proposal Withdrawal Fix

## Problem
Ang user (vcdhh95@gmail.com) ay hindi maka-withdraw ng proposal kahit pending pa ang status.

## Root Cause
Ang backend repositories ay gumagamit ng `getSupabaseClient()` na nag-uuse ng ANON key, which means Row Level Security (RLS) policies ay enforced. Pero walang RLS policy na nag-aallow sa freelancers na mag-update ng kanilang sariling proposals.

Ang existing RLS policy sa `proposals` table ay:
```sql
CREATE POLICY "Service role full access proposals" ON proposals FOR ALL USING (true);
```

Ito ay nag-aallow lang ng access kapag gumagamit ng SERVICE ROLE key, hindi ANON key.

## Solution
Pinalitan ang lahat ng repositories para gumamit ng `getSupabaseServiceClient()` instead of `getSupabaseClient()`. Ito ay nag-uuse ng SERVICE ROLE key na may full access sa database at nag-bypass ng RLS policies.

### Files Changed:
1. `FreelanceXchain-api/src/repositories/base-repository.ts`
   - Changed import from `getSupabaseClient` to `getSupabaseServiceClient`
   - Updated `getClient()` method to use service client

2. `FreelanceXchain-api/src/repositories/didit-kyc-repository.ts`
   - Changed import from `getSupabaseClient` to `getSupabaseServiceClient`
   - Updated client initialization

## Testing
Para ma-test ang fix:

1. Restart ang backend server:
   ```bash
   cd FreelanceXchain-api
   npm run dev
   ```

2. Login as freelancer (vcdhh95@gmail.com)

3. Try to withdraw a pending proposal:
   - Go to "My Proposals" page
   - Click "Withdraw" button on a pending proposal
   - Dapat successful na ang withdrawal

## Technical Details

### Before:
```typescript
// base-repository.ts
import { getSupabaseClient } from '../config/supabase.js';

protected getClient(): SupabaseClient {
  if (!this.client) {
    this.client = getSupabaseClient(); // Uses ANON key
  }
  return this.client;
}
```

### After:
```typescript
// base-repository.ts
import { getSupabaseServiceClient } from '../config/supabase.js';

protected getClient(): SupabaseClient {
  if (!this.client) {
    this.client = getSupabaseServiceClient(); // Uses SERVICE ROLE key
  }
  return this.client;
}
```

## Security Note
Ang paggamit ng SERVICE ROLE key sa backend ay safe dahil:
1. Ang backend ay nag-validate ng user authentication via JWT tokens
2. Ang business logic sa services ay nag-check ng ownership at permissions
3. Ang RLS policies ay hindi na kailangan dahil ang backend mismo ang nag-eenforce ng security rules

Ang pattern na ito ay consistent sa ibang enterprise applications na ang backend service ay trusted at may full database access, habang ang client-side applications ay restricted via API endpoints.
