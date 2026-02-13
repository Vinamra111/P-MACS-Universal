# P-MACS API Documentation

**Version:** 1.0.0
**Base URL:** `https://pmacs.yourhospital.com/api`
**Authentication:** Role-based with session tokens

---

## Table of Contents

1. [Authentication](#authentication)
2. [Nurse Endpoints](#nurse-endpoints)
3. [Pharmacist Endpoints](#pharmacist-endpoints)
4. [Admin Endpoints](#admin-endpoints)
5. [System Endpoints](#system-endpoints)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)

---

## Authentication

### POST `/api/login`

Authenticate user and create session.

**Request:**
```json
{
  "empId": "P001",
  "password": "pharma"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "empId": "P001",
    "name": "John Doe",
    "role": "Pharmacist",
    "status": "Active"
  }
}
```

**Response (401):**
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

**Response (403):**
```json
{
  "success": false,
  "error": "Account is blacklisted"
}
```

---

### POST `/api/logout`

Terminate current session.

**Request:**
```json
{
  "empId": "P001"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Nurse Endpoints

### POST `/api/nurse/chat`

Query the AI assistant with nurse-level permissions.

**Headers:**
```
Content-Type: application/json
```

**Request:**
```json
{
  "message": "Where is Morphine?",
  "userId": "N001"
}
```

**Response (200):**
```json
{
  "success": true,
  "response": "**Morphine Availability**\n\n| Location | Quantity | Expiry Date |\n|----------|----------|-------------|\n| **ICU-Shelf-A** | 15 vials | 2025-08-10 |\n| **ER-Cabinet-2** | 8 vials (Low Stock) | 2025-07-05 |",
  "suggestions": [
    "When does Morphine expire?",
    "Check Morphine in ICU",
    "Show expiring medications"
  ],
  "context": {
    "lastDrug": "Morphine",
    "lastLocation": "ICU-Shelf-A",
    "messageCount": 1
  }
}
```

**Response (400):**
```json
{
  "error": "Invalid message format"
}
```

**Response (500):**
```json
{
  "error": "I encountered an error processing your request.",
  "message": "Detailed error message",
  "success": false
}
```

**Permissions:**
- ✅ Drug location queries
- ✅ Ward inventory checks
- ✅ Expiring drug alerts
- ✅ FEFO recommendations
- ❌ Forecasting (denied)
- ❌ Inventory updates (denied)

---

### GET `/api/nurse/dashboard`

Get dashboard statistics for nurses.

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "totalItems": 2000,
    "lowStock": 45,
    "expiringSoon": 23,
    "stockouts": 5,
    "criticalAlerts": 8
  }
}
```

---

### GET `/api/nurse/alerts`

Get critical alerts for nurse attention.

**Response (200):**
```json
{
  "success": true,
  "alerts": [
    {
      "id": "alert_001",
      "type": "stockout",
      "drug": "Insulin Glargine",
      "location": "Ward-2-Fridge",
      "severity": "critical",
      "message": "Out of stock",
      "quantity": 0
    }
  ]
}
```

---

## Pharmacist Endpoints

### POST `/api/pharmacist/chat`

Query the AI assistant with pharmacist-level permissions.

**Headers:**
```
Content-Type: application/json
```

**Request:**
```json
{
  "message": "Show top movers for December",
  "userId": "P001"
}
```

**Response (200):**
```json
{
  "success": true,
  "response": "**Top Movers - December 2025**\n\n| Rank | Drug Name | Total Used | Avg Daily Usage | Days of Stock |\n|------|-----------|------------|-----------------|---------------|\n| 1 | **Paracetamol 500mg** | 1245 | 40.2 | 12 |\n| 2 | **Amoxicillin 500mg** | 987 | 31.8 | 18 |",
  "suggestions": [
    "Show slow movers",
    "Analyze seasonal patterns",
    "Forecast Paracetamol demand"
  ],
  "context": {
    "lastDrug": "Paracetamol",
    "lastAction": "analyze",
    "messageCount": 1
  }
}
```

**Permissions:**
- ✅ All nurse permissions
- ✅ ML-based forecasting
- ✅ Inventory updates
- ✅ Analytics reports
- ✅ Purchase orders
- ❌ User management (admin only)

---

### GET `/api/pharmacist/dashboard`

Get dashboard statistics for pharmacists.

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "totalItems": 2000,
    "lowStock": 45,
    "expiringSoon": 23,
    "stockouts": 5,
    "criticalAlerts": 8
  }
}
```

---

## Admin Endpoints

### GET `/api/admin/users`

Get all users (admin only).

**Headers:**
```
x-user-id: M001
```

**Response (200):**
```json
{
  "success": true,
  "users": [
    {
      "empId": "P001",
      "name": "John Doe",
      "role": "Pharmacist",
      "status": "Active",
      "unifiedGroup": "Pharmacist",
      "createdAt": "2025-01-01T00:00:00Z",
      "lastLogin": "2025-01-23T10:30:00Z"
    }
  ]
}
```

**Response (403):**
```json
{
  "success": false,
  "error": "Unauthorized - Master role required"
}
```

---

### POST `/api/admin/users`

Create new user (admin only).

**Headers:**
```
x-user-id: M001
Content-Type: application/json
```

**Request:**
```json
{
  "empId": "N011",
  "name": "Jane Smith",
  "role": "Nurse",
  "password": "securePassword123"
}
```

**Response (201):**
```json
{
  "success": true,
  "user": {
    "empId": "N011",
    "name": "Jane Smith",
    "role": "Nurse",
    "status": "Active"
  }
}
```

**Response (400):**
```json
{
  "success": false,
  "error": "User already exists"
}
```

---

### PUT `/api/admin/users/:empId`

Update user status (whitelist/blacklist).

**Headers:**
```
x-user-id: M001
Content-Type: application/json
```

**Request:**
```json
{
  "action": "blacklist"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "empId": "P001",
    "status": "Blacklisted"
  }
}
```

---

### DELETE `/api/admin/users/:empId`

Delete user (admin only).

**Headers:**
```
x-user-id: M001
```

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

### GET `/api/admin/access-logs`

Get system access logs.

**Headers:**
```
x-user-id: M001
```

**Query Parameters:**
- `limit` (optional): Number of logs to return (default: 100)

**Response (200):**
```json
{
  "success": true,
  "logs": [
    {
      "timestamp": "2025-01-23T10:30:00Z",
      "empId": "P001",
      "action": "LOGIN",
      "role": "Pharmacist",
      "details": "Login successful"
    }
  ]
}
```

---

## System Endpoints

### GET `/api/health`

Health check endpoint for monitoring.

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-23T10:30:00Z",
  "version": "1.0.0",
  "uptime": 86400,
  "checks": {
    "database": {
      "status": "ok",
      "filesFound": 3
    },
    "openai": {
      "status": "ok"
    },
    "memory": {
      "status": "ok",
      "used": 512,
      "total": 2048,
      "percentUsed": 25
    },
    "environment": {
      "status": "ok",
      "nodeEnv": "production",
      "requiredVariables": {
        "OPENAI_API_KEY": true,
        "NODE_ENV": true
      }
    }
  }
}
```

**Response (503):**
```json
{
  "status": "unhealthy",
  "checks": {
    "openai": {
      "status": "error",
      "message": "OpenAI API key not configured"
    }
  }
}
```

---

### GET `/api/health/ready`

Readiness check for load balancers.

**Response (200):**
```json
{
  "ready": true,
  "checks": {
    "database": true,
    "openai": true
  },
  "timestamp": "2025-01-23T10:30:00Z"
}
```

**Response (503):**
```json
{
  "ready": false,
  "checks": {
    "database": false,
    "openai": true
  }
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  }
}
```

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Request completed successfully |
| 201 | Created | User created successfully |
| 400 | Bad Request | Invalid input parameters |
| 401 | Unauthorized | Invalid credentials |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error occurred |
| 503 | Service Unavailable | Service temporarily unavailable |

### Common Error Codes

| Code | Description |
|------|-------------|
| `INVALID_CREDENTIALS` | Login failed - wrong empId or password |
| `USER_BLACKLISTED` | Account is blacklisted |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INVALID_INPUT` | Input validation failed |
| `DATABASE_ERROR` | Database operation failed |
| `AI_SERVICE_ERROR` | OpenAI API error |
| `SESSION_EXPIRED` | User session expired |

---

## Rate Limiting

### Default Limits

- **Global:** 100 requests per minute per IP
- **Chat endpoints:** 60 requests per minute per user
- **Admin endpoints:** 30 requests per minute

### Rate Limit Headers

Every response includes:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2025-01-23T10:31:00Z
```

### Rate Limit Exceeded Response

```json
{
  "error": "Too many requests. Please try again later."
}
```

Headers:
```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2025-01-23T10:31:00Z
Retry-After: 45
```

---

## Request/Response Examples

### Example 1: Nurse Drug Lookup

**Request:**
```bash
curl -X POST https://pmacs.yourhospital.com/api/nurse/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Where is Propofol?",
    "userId": "N001"
  }'
```

**Response:**
```json
{
  "success": true,
  "response": "**Propofol Availability**\n\n| Location | Quantity | Expiry Date |\n|----------|----------|-------------|\n| **ICU-Shelf-A** | 23 vials | 2025-06-15 |\n| **ER-Storage** | 12 vials | 2025-05-20 |",
  "suggestions": [
    "When does Propofol expire?",
    "Check Propofol in ICU"
  ]
}
```

### Example 2: Pharmacist Forecasting

**Request:**
```bash
curl -X POST https://pmacs.yourhospital.com/api/pharmacist/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Forecast Morphine demand for next 30 days",
    "userId": "P001"
  }'
```

**Response:**
```json
{
  "success": true,
  "response": "**Morphine 10mg - 30-Day Forecast**\n\nPredicted Daily Usage: 12.5 vials ± 2.3\nTotal 30-Day Need: 375 vials\nCurrent Stock: 89 vials\n\n**Recommendation:** Order 300 vials within 7 days",
  "suggestions": [
    "Show Morphine usage trends",
    "Generate purchase order for Morphine"
  ]
}
```

### Example 3: Admin User Management

**Request:**
```bash
curl -X POST https://pmacs.yourhospital.com/api/admin/users \
  -H "Content-Type: application/json" \
  -H "x-user-id: M001" \
  -d '{
    "empId": "P007",
    "name": "Dr. Sarah Johnson",
    "role": "Pharmacist",
    "password": "secure123"
  }'
```

**Response:**
```json
{
  "success": true,
  "user": {
    "empId": "P007",
    "name": "Dr. Sarah Johnson",
    "role": "Pharmacist",
    "status": "Active",
    "createdAt": "2025-01-23T10:30:00Z"
  }
}
```

---

## WebSocket Support (Future)

Currently not implemented. All real-time updates use polling.

**Planned for v2.0:**
- WebSocket connection for real-time dashboard updates
- Live notification system
- Real-time collaboration features

---

## Changelog

### v1.0.0 (January 2026)
- Initial production release
- 27 LangChain tools
- 3 role-based interfaces
- Health check endpoints
- Rate limiting
- Comprehensive error handling

---

## Support

For API issues or questions:
- **Email:** api-support@yourhospital.com
- **Slack:** #pmacs-api-support
- **Documentation:** https://docs.pmacs.yourhospital.com

---

**Happy coding!** 🚀
