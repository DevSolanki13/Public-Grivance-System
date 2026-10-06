# JanSewa — Civic Redressal Backend REST API

This directory contains the dedicated **Backend REST API** service for the JanSewa Public Grievance Redressal Portal.

---

## 📁 Architecture Overview

```
backend/
├── controllers/          # Business logic handlers
│   └── grievanceController.js
├── middleware/           # RBAC and authentication filters
│   └── authMiddleware.js
├── models/               # Domain data models & schemas
│   ├── Grievance.js
│   └── User.js
├── routes/               # Modular Express endpoint definitions
│   ├── grievanceRoutes.js
│   └── analyticsRoutes.js
├── .env.example          # Environment variables template
├── package.json          # Server dependencies & scripts
├── server.js             # Express application entrypoint
└── README.md             # Backend architecture documentation
```

---

## 🚀 API Endpoints Specification

### 1. Grievance Management (`/api/grievances`)

| Method | Endpoint | Access / Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/grievances` | Authenticated | List all grievances (filterable by `role`, `department`, `status`). |
| `GET` | `/api/grievances/:id` | Authenticated | Fetch full details, before/after evidence photos, and timeline history. |
| `POST` | `/api/grievances` | Citizen / Public | Register new civic complaint with geotag & initial photo. |
| `PATCH` | `/api/grievances/:id/assign` | Dept Head / Admin | Triage category, allocate department, and dispatch field officer. |
| `POST` | `/api/grievances/:id/resolve` | Field Officer | Attach completed repair photo proof and mark as Resolved. |
| `POST` | `/api/grievances/:id/verify` | Citizen | Citizen verification: Approve to Close (with star rating) or Reject to Reopen. |

### 2. Public Analytics & Transparency (`/api/analytics`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/analytics/transparency` | Public | Real-time SLA compliance, resolution rate, and category distribution. |

### 3. System Health

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Server uptime & status check. |

---

## 🛠️ How to Run the Backend Standalone

```bash
cd backend
npm install
npm run dev
```

The server starts on `http://localhost:5000`.
