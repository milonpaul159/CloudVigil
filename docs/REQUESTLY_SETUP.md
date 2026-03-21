# Requestly API Client — Test Suite Setup Guide

This guide provides the exact step-by-step configuration to test all CloudVigil API routes using the **Requestly API Client**. Use this to record your hackathon demo video.

---

## Prerequisites

1. CloudVigil server running on `http://localhost:5000`
2. [Requestly API Client](https://app.requestly.io) open in your browser
3. Create a new **Collection** in Requestly called `CloudVigil API Tests`

---

## Request 1: Health Check (Warm-up)

> Show judges the server is live before testing auth.

| Field       | Value                              |
|-------------|-------------------------------------|
| **Method**  | `GET`                              |
| **URL**     | `http://localhost:5000/api/health`  |
| **Headers** | None required                      |

### Expected Response (`200 OK`)
```json
{
  "success": true,
  "message": "CloudVigil API is running",
  "timestamp": "2026-03-21T07:30:00.000Z",
  "uptime": 42.5
}
```

---

## Request 2: Login & Extract JWT Token

| Field        | Value                                    |
|--------------|------------------------------------------|
| **Method**   | `POST`                                   |
| **URL**      | `http://localhost:5000/api/auth/login`    |
| **Headers**  | `Content-Type: application/json`         |

### Request Body (JSON)
```json
{
  "username": "admin",
  "password": "admin123"
}
```

### Expected Response (`200 OK`)
```json
{
  "success": true,
  "message": "Authentication successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr_cloudvigil_001",
    "username": "admin",
    "role": "admin"
  }
}
```

### 🔑 How to Extract the Token in Requestly

1. Send the login request and verify you get a `200 OK` response.
2. **Copy** the `token` value from the response body (the long `eyJ...` string).
3. In your Requestly Collection, go to **Variables** or **Environment** settings.
4. Create a variable called `TOKEN` and paste the JWT value.
5. In all subsequent requests, reference it in the Authorization header as:
   ```
   Bearer {{TOKEN}}
   ```

> **Pro Tip for Demo**: Show the response in the Requestly UI, highlight the token, and explain that you're using it as a Bearer token for subsequent protected requests.

---

## Request 3: Add a Monitoring Target (Protected)

| Field        | Value                                   |
|--------------|------------------------------------------|
| **Method**   | `POST`                                  |
| **URL**      | `http://localhost:5000/api/targets`      |

### Headers
| Header          | Value                    |
|-----------------|--------------------------|
| `Content-Type`  | `application/json`       |
| `Authorization` | `Bearer {{TOKEN}}`       |

### Request Body (JSON)
```json
{
  "url": "https://jsonplaceholder.typicode.com/posts/1",
  "name": "JSONPlaceholder API"
}
```

### Expected Response (`201 Created`)
```json
{
  "success": true,
  "message": "Target added successfully",
  "target": {
    "_id": "665a1b2c3d4e5f...",
    "url": "https://jsonplaceholder.typicode.com/posts/1",
    "name": "JSONPlaceholder API",
    "isActive": true,
    "createdBy": "admin",
    "createdAt": "2026-03-21T07:30:00.000Z",
    "updatedAt": "2026-03-21T07:30:00.000Z"
  }
}
```

### 🧪 Validation Test — Missing Auth Header

Send the same request **without** the `Authorization` header to demonstrate that JWT protection is working:

### Expected Response (`401 Unauthorized`)
```json
{
  "success": false,
  "error": "Access denied. No Authorization header provided."
}
```

---

## Request 4: Get Analytics Data (Protected)

| Field        | Value                                    |
|--------------|------------------------------------------|
| **Method**   | `GET`                                    |
| **URL**      | `http://localhost:5000/api/analytics`     |

### Headers
| Header          | Value              |
|-----------------|--------------------|
| `Authorization` | `Bearer {{TOKEN}}` |

### Optional Query Parameters
| Param   | Value | Description                  |
|---------|-------|------------------------------|
| `hours` | `24`  | Look-back window (default 24)|

Full URL with query param: `http://localhost:5000/api/analytics?hours=24`

### Expected Response (`200 OK`)
```json
{
  "success": true,
  "period": "Last 24 hours",
  "generatedAt": "2026-03-21T07:35:00.000Z",
  "analytics": [
    {
      "name": "JSONPlaceholder API",
      "url": "https://jsonplaceholder.typicode.com/posts/1",
      "isActive": true,
      "totalPings": 48,
      "successfulPings": 48,
      "uptimePercent": 100,
      "avgLatencyMs": 85.5,
      "maxLatencyMs": 170,
      "minLatencyMs": 20,
      "latestStatus": {
        "statusCode": 200,
        "latencyMs": 45,
        "isSuccess": true,
        "errorMessage": null,
        "checkedAt": "2026-03-21T07:30:00.000Z"
      },
      "recentHistory": [...]
    },
    {
      "name": "Failing Endpoint",
      "url": "https://httpstat.us/500",
      "uptimePercent": 0,
      "avgLatencyMs": 312.4,
      "latestStatus": {
        "statusCode": 500,
        "isSuccess": false,
        "errorMessage": "HTTP 500: Internal Server Error"
      }
    }
  ]
}
```

---

## Request 5: Manual Ping Trigger (Protected)

| Field        | Value                                         |
|--------------|------------------------------------------------|
| **Method**   | `POST`                                        |
| **URL**      | `http://localhost:5000/api/pings/trigger`       |

### Headers
| Header          | Value              |
|-----------------|--------------------|
| `Authorization` | `Bearer {{TOKEN}}` |

### Expected Response (`200 OK`)
```json
{
  "success": true,
  "message": "Ping cycle complete. 3 endpoint(s) checked.",
  "results": [
    {
      "url": "https://jsonplaceholder.typicode.com/posts/1",
      "name": "JSONPlaceholder API",
      "statusCode": 200,
      "latencyMs": 142.34,
      "isSuccess": true,
      "errorMessage": null
    }
  ]
}
```

---

## Recommended Demo Flow (for Video Recording)

1. **Health Check** → Show the server is live
2. **Login** → Send POST, get JWT, show successful auth
3. **Fail Test** → Hit `/api/targets` WITHOUT token → show 401 error
4. **Add Target** → Send POST with Bearer token → show 201 success
5. **Trigger Ping** → Hit `/api/pings/trigger` → show real-time ping results
6. **Get Analytics** → Hit `/api/analytics` → show uptime %, latency stats
7. **Narrate** → Explain how Requestly API Client made JWT testing & debugging seamless

---

## Requestly CORS Bypass Rule (Browser Extension)

If your React frontend (e.g., `localhost:5173`) needs to hit the Express backend directly and encounters CORS errors, set up this rule in the **Requestly Browser Extension**:

### Configuration

| Field           | Value                                              |
|-----------------|-----------------------------------------------------|
| **Rule Type**   | Modify Headers                                      |
| **Match URL**   | `localhost:5000`                                    |
| **Action**      | Modify Response Headers                             |

### Headers to Add/Override on Response

| Header Name                        | Header Value                                               |
|------------------------------------|------------------------------------------------------------|
| `Access-Control-Allow-Origin`      | `http://localhost:5173`                                    |
| `Access-Control-Allow-Methods`     | `GET, POST, PUT, DELETE, PATCH, OPTIONS`                   |
| `Access-Control-Allow-Headers`     | `Content-Type, Authorization, X-Requested-With`            |
| `Access-Control-Allow-Credentials` | `true`                                                     |

> **Note**: The Express backend already has the `cors` npm package configured to allow all origins. This Requestly rule is an additional safety net and a great talking point for the Requestly sponsor track demo.
