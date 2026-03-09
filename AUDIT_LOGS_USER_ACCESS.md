# Audit Logs - User Access Guide

## Overview

Oo, may audit logs na accessible para sa users! Pwede nilang makita lahat ng kanilang activities sa platform through the audit logs API.

## User Endpoint

### GET /api/audit-logs/me

Ito ang endpoint para makita ng users ang kanilang sariling audit logs.

**Authentication Required:** Yes (Bearer token)

**Query Parameters:**
- `limit` (optional): Number of logs to retrieve (default: 100, max: 100)

**Example Request:**
```bash
curl -X GET "https://api.freelancexchain.com/api/audit-logs/me?limit=50" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Example Response:**
```json
{
  "logs": [
    {
      "id": "uuid-1",
      "user_id": "user-uuid",
      "actor_id": "user@example.com",
      "action": "user_login",
      "resource_type": "auth",
      "resource_id": null,
      "payload": {
        "method": "email",
        "device": "Chrome on Windows"
      },
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "status": "success",
      "error_message": null,
      "created_at": "2024-02-19T10:30:00Z"
    },
    {
      "id": "uuid-2",
      "user_id": "user-uuid",
      "actor_id": "user@example.com",
      "action": "contract_signed",
      "resource_type": "contract",
      "resource_id": "contract-uuid",
      "payload": {
        "contractAmount": 1000,
        "signerRole": "freelancer"
      },
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "status": "success",
      "error_message": null,
      "created_at": "2024-02-19T09:15:00Z"
    }
  ]
}
```

## What Gets Logged?

Users can see logs for these actions:

### Authentication
- `user_login` - Login attempts
- `user_logout` - Logout events
- `user_password_change` - Password changes
- `mfa_enabled` - MFA activation
- `mfa_disabled` - MFA deactivation

### Profile
- `user_updated` - Profile updates
- `kyc_submitted` - KYC verification submitted
- `kyc_approved` - KYC verification approved
- `kyc_rejected` - KYC verification rejected

### Contracts
- `contract_created` - New contract created
- `contract_signed` - Contract signed
- `contract_updated` - Contract modified
- `contract_cancelled` - Contract cancelled

### Payments
- `payment_initiated` - Payment started
- `payment_completed` - Payment successful
- `payment_failed` - Payment failed
- `payment_refunded` - Payment refunded

### Disputes
- `dispute_created` - Dispute opened
- `dispute_resolved` - Dispute resolved
- `dispute_escalated` - Dispute escalated

### Projects & Proposals
- `project_created` - New project posted
- `project_updated` - Project modified
- `proposal_submitted` - Proposal sent
- `proposal_accepted` - Proposal accepted

## Frontend Integration Example

### React/TypeScript Component

```typescript
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  payload: Record<string, any>;
  ip_address: string | null;
  status: 'success' | 'failure' | 'pending';
  error_message: string | null;
  created_at: string;
}

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/audit-logs/me?limit=50');
      setLogs(response.data.logs);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      user_login: 'Logged In',
      user_logout: 'Logged Out',
      contract_signed: 'Signed Contract',
      payment_completed: 'Payment Completed',
      project_created: 'Created Project',
      // Add more mappings
    };
    return labels[action] || action;
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      success: 'bg-green-100 text-green-800',
      failure: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <div>Loading audit logs...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Activity Log</h1>
      
      <div className="bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Resource
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                IP Address
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {getActionLabel(log.action)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {log.resource_type}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(log.status)}`}>
                    {log.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.ip_address || 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### API Client Setup

```typescript
// lib/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## Security Features

### Row-Level Security (RLS)
- Users can ONLY see their own audit logs
- Admins can see all logs through different endpoints
- Logs are immutable (cannot be modified or deleted)

### What's Protected
- Sensitive data (passwords, tokens) are NEVER logged
- IP addresses are logged for security monitoring
- User agents help identify suspicious activity

## Use Cases

### For Users
1. **Security Monitoring**: Check for unauthorized access attempts
2. **Activity History**: Review your actions on the platform
3. **Compliance**: Export logs for your records
4. **Dispute Resolution**: Provide evidence of actions taken

### For Admins
Admins have additional endpoints:
- `/api/audit-logs/user/:userId` - View specific user's logs
- `/api/audit-logs/resource/:resourceType/:resourceId` - View resource-specific logs
- `/api/audit-logs/failed` - View failed actions
- `/api/audit-logs/report/system` - Generate system-wide reports

## Best Practices

### Frontend Implementation
1. **Pagination**: Always use the `limit` parameter to avoid large responses
2. **Filtering**: Consider adding client-side filtering by action type
3. **Date Formatting**: Use user's local timezone for display
4. **Error Handling**: Handle 401 (unauthorized) and 500 (server error) responses
5. **Refresh**: Add a refresh button to fetch latest logs

### User Experience
1. **Clear Labels**: Use human-readable action names
2. **Status Indicators**: Use color-coded badges for success/failure
3. **Details View**: Allow users to expand rows to see payload details
4. **Export**: Consider adding CSV/PDF export functionality
5. **Search**: Add search functionality for large log sets

## Testing

### Manual Testing
```bash
# Get your audit logs
curl -X GET "http://localhost:3000/api/audit-logs/me?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# After performing an action (e.g., login), check if it's logged
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Then check logs again
curl -X GET "http://localhost:3000/api/audit-logs/me?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### Logs Not Appearing
1. Check if you're authenticated (valid token)
2. Verify the action is being logged (check middleware)
3. Check Supabase RLS policies are enabled
4. Verify service role is used for logging

### Empty Response
- You might not have any logged actions yet
- Try performing an action (login, update profile) first
- Check if the date range is correct

### 401 Unauthorized
- Token expired or invalid
- Refresh your access token
- Re-authenticate

## Future Enhancements

Planned features:
- [ ] Real-time log streaming via WebSocket
- [ ] Advanced filtering (by date range, action type)
- [ ] Export logs to CSV/PDF
- [ ] Email notifications for suspicious activities
- [ ] Mobile app integration
- [ ] Log retention policies

## Support

For issues or questions:
- Check the main [Audit Logs Documentation](./AUDIT_LOGS.md)
- Review [Integration Examples](./AUDIT_LOGS_INTEGRATION_EXAMPLES.md)
- Contact support team

---

**Summary**: Yes, users can view their audit logs through the `/api/audit-logs/me` endpoint. The system automatically logs all important actions and users can access their complete activity history for security monitoring and compliance purposes.
