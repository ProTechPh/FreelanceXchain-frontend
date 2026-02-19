# Audit Logs - Quick Start Guide

## Para sa Users

### Paano Makita ang Activity Logs

1. **Login sa account mo**
2. **Pumunta sa Settings** (sidebar o navigation)
3. **Sa Security section**, makikita mo ang "Activity Log" card
4. **Click "View Log"** button

O direktang pumunta sa: `http://localhost:5173/settings/activity`

---

## Ano ang Makikita Mo?

### Main Features

#### 📊 Statistics Dashboard
- **Total Events** - Lahat ng activities mo
- **Successful** - Mga successful actions (green)
- **Failed** - Mga failed attempts (red)

#### 🔍 Search & Filter
- **Search bar** - Hanapin ang specific action o resource
- **Status filter** - Filter by Success, Failed, or Pending
- **Refresh button** - I-reload ang latest logs
- **Export button** - Download as CSV file

#### 📋 Activity Table
Makikita mo ang:
- ✅ **Status icon** - Success (✓), Failed (✗), Pending (!)
- 🎯 **Action** - Ano ang ginawa (e.g., "Logged In", "Contract Signed")
- 📁 **Resource** - Saan nangyari (auth, contract, payment, etc.)
- 📅 **Date & Time** - Kailan nangyari
- 🌐 **IP Address** - Saan galing ang action
- 🏷️ **Status badge** - Color-coded status

#### 🔎 Detailed View
Click sa kahit anong row para makita ang:
- Complete action details
- Resource ID
- User agent (browser/device info)
- Error messages (kung may failure)
- Additional data (JSON payload)

---

## Mga Logged Actions

### 🔐 Authentication
- Login/Logout attempts
- Password changes
- MFA enable/disable

### 👤 Profile & KYC
- Profile updates
- KYC submissions
- KYC approvals/rejections

### 📄 Contracts
- Contract creation
- Contract signing
- Contract updates/cancellations

### 💰 Payments
- Payment initiation
- Payment completion
- Payment failures/refunds

### ⚖️ Disputes
- Dispute creation
- Dispute resolution
- Dispute escalation

### 📋 Projects & Proposals
- Project creation/updates
- Proposal submissions
- Proposal acceptance

---

## Security Features

### 🔒 Privacy
- Makikita mo lang ang **sarili mong logs**
- Hindi pwedeng i-edit o i-delete ang logs
- Admins may separate access para sa monitoring

### 🛡️ Security Monitoring
- **IP Address tracking** - Makita kung saan ka nag-login
- **Failed attempts** - Alerto sa suspicious activities
- **Device info** - Alam mo kung anong device ginamit

### 📊 Compliance
- Export logs para sa records
- Audit trail para sa disputes
- Compliance with GDPR, SOC 2, etc.

---

## Export to CSV

### Paano Mag-export?

1. **Click "Export" button** sa top right
2. **Automatic download** ng CSV file
3. **Filename:** `activity-log-2024-02-19.csv`

### CSV Contents
```csv
Date,Action,Resource,Status,IP Address
"2024-02-19 10:30:00","Logged In","auth","success","192.168.1.1"
"2024-02-19 09:15:00","Contract Signed","contract","success","192.168.1.1"
```

---

## Use Cases

### 1. Security Monitoring
**Scenario:** Nakita mo na may login attempt na hindi mo ginawa

**Action:**
1. Check activity log
2. Tingnan ang IP address at timestamp
3. Kung suspicious, change password immediately
4. Enable MFA kung wala pa

### 2. Dispute Resolution
**Scenario:** May dispute sa contract signing

**Action:**
1. Export activity logs
2. Show proof na nag-sign ka ng contract
3. Timestamp at IP address as evidence

### 3. Compliance & Audit
**Scenario:** Need ng records para sa audit

**Action:**
1. Filter by date range (future feature)
2. Export to CSV
3. Submit as compliance documentation

### 4. Activity Review
**Scenario:** Gusto mo lang i-review ang activities mo

**Action:**
1. Browse through the activity log
2. Check kung lahat ng actions ay expected
3. Verify payment completions

---

## Troubleshooting

### Walang Logs?
- Baka bagong account pa (walang activities yet)
- Try to perform an action (login, update profile)
- Refresh the page

### 401 Unauthorized Error?
- Token expired
- Re-login to get new token
- Check if naka-authenticate ka

### Logs Hindi Nag-update?
- Click "Refresh" button
- Check internet connection
- Verify backend is running

---

## Technical Details

### API Endpoint
```
GET /api/audit-logs/me?limit=100
Authorization: Bearer <your-token>
```

### Response Format
```json
{
  "logs": [
    {
      "id": "uuid",
      "action": "user_login",
      "resource_type": "auth",
      "status": "success",
      "created_at": "2024-02-19T10:30:00Z",
      "ip_address": "192.168.1.1"
    }
  ]
}
```

---

## Screenshots Guide

### 1. Settings Page
```
Settings → Security Section → Activity Log Card → "View Log" Button
```

### 2. Activity Log Page
```
┌─────────────────────────────────────────────────────────┐
│ Activity Log                    [Refresh] [Export]      │
├─────────────────────────────────────────────────────────┤
│ [Search...] [Status Filter ▼]                          │
│                                                         │
│ Total: 150  |  Success: 145  |  Failed: 5             │
├─────────────────────────────────────────────────────────┤
│ Status | Action        | Resource | Date      | IP     │
├─────────────────────────────────────────────────────────┤
│   ✓    | Logged In     | auth     | Feb 19... | 192... │
│   ✓    | Contract Sign | contract | Feb 19... | 192... │
│   ✗    | Payment Failed| payment  | Feb 18... | 192... │
└─────────────────────────────────────────────────────────┘
```

### 3. Detail Modal
```
┌─────────────────────────────────────┐
│ Activity Details              [✕]   │
├─────────────────────────────────────┤
│ Action: Logged In                   │
│ Status: ✓ success                   │
│ Resource: auth                      │
│ Date: February 19, 2024 10:30:00   │
│ IP Address: 192.168.1.1            │
│ User Agent: Chrome on Windows      │
└─────────────────────────────────────┘
```

---

## Summary

✅ **Implemented:** Complete activity log viewer for users
✅ **Features:** Search, filter, export, detailed view
✅ **Security:** User isolation, read-only, IP tracking
✅ **Access:** Settings → Security → Activity Log

**Users can now monitor their account activity and maintain security compliance!**

---

## Support

Para sa issues o questions:
- Check `AUDIT_LOGS_USER_ACCESS.md` for detailed API docs
- Check `AUDIT_LOGS_FRONTEND_IMPLEMENTATION.md` for technical details
- Contact support team
