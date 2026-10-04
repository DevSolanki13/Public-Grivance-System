# JanSewa - Public Grievance Redressal & Civic SLA Monitoring Platform

A fullstack municipal public grievance redressal platform engineered with strict accountability workflows, SLA countdown tracking, officer resolution proof verification, citizen reopen & escalation mechanics, and multi-role access control.

---

## 📁 Repository Directory Structure

```text
JanSewa-Complete/
├── backend/
│   ├── constants/             # Domain constants, roles, and status definitions
│   │   └── index.js
│   ├── controllers/           # HTTP request/response handlers only (extracts req, invokes service)
│   │   ├── authController.js
│   │   ├── grievanceController.js
│   │   ├── departmentController.js
│   │   ├── analyticsController.js
│   │   └── notificationController.js
│   ├── middleware/            # JWT authentication, RBAC, and file/camera uploads
│   │   ├── authMiddleware.js
│   │   ├── roleMiddleware.js
│   │   ├── uploadMiddleware.js
│   │   └── errorHandler.js
│   ├── routes/                # Express route declarations (pure endpoint mapping)
│   │   ├── authRoutes.js
│   │   ├── grievanceRoutes.js
│   │   ├── departmentRoutes.js
│   │   ├── analyticsRoutes.js
│   │   ├── notificationRoutes.js
│   │   └── index.js
│   ├── services/              # Core domain business logic and database queries
│   │   ├── authService.js
│   │   ├── grievanceService.js
│   │   ├── departmentService.js
│   │   ├── analyticsService.js
│   │   ├── notificationService.js
│   │   ├── stateMachine.js
│   │   └── slaService.js
│   ├── utils/                 # Server helper utilities
│   │   ├── token.js
│   │   └── helpers.js
│   ├── prisma.js              # Shared Prisma / persistent data client
│   ├── db.js                  # Persistent DataStore instance with seed data
│   ├── server.js              # Express app entry point
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── api/                   # API gateway functions (fetch/axios calls)
│   │   ├── client.js          # Base HTTP client with JWT header attachment & error unwrapping
│   │   ├── authApi.js
│   │   ├── grievanceApi.js
│   │   ├── departmentApi.js
│   │   ├── analyticsApi.js
│   │   ├── notificationApi.js
│   │   └── index.js           # Re-exports modular APIs and unified gateway
│   ├── components/            # View containers, modals, and UI components
│   │   ├── common/            # StatusBadge, PriorityBadge, SLABadge, StatCard, Stepper, PhotoUploader
│   │   ├── layout/            # Navbar, Footer, PageLayout
│   │   ├── grievance/         # ResolutionModal, VerificationModal, AssignModal
│   │   ├── notifications/     # NotificationDrawer (anchored right below bell with click-outside)
│   │   └── pages/             # View containers (Citizen, Officer, Department, Admin, Public, Auth)
│   ├── context/               # AuthContext (multi-role & 1-click test switcher) and NotificationContext
│   ├── utils/                 # Client formatters and helpers
│   │   ├── formatters.js
│   │   └── helpers.js
│   ├── App.jsx                # Main app router/shell with role protection
│   ├── main.jsx               # React DOM root entry
│   ├── index.css              # Authentic JanSewa aesthetic stylesheet
│   ├── index.html
│   ├── vite.config.js         # Vite dev server with proxy and bypass configuration
│   └── package.json
│
├── package.json               # Root runner script (concurrently runs backend + frontend)
└── README.md
```

---

## 🏛️ Architectural Rules & Separation of Concerns

1. **Strict 3-Tier Backend Separation**:
   - **Routes (`backend/routes/`)**: Pure endpoint definitions mapping HTTP verbs and URLs to controller handlers.
   - **Controllers (`backend/controllers/`)**: HTTP request/response handlers only. They parse query parameters, body payloads, and route parameters, call the corresponding service methods, and return formatted JSON responses.
   - **Services (`backend/services/`)**: Encapsulate all civic business logic, SLA deadline calculation, role lifecycle permissions, audit logging, and data persistence.

2. **Decoupled Client-Side API Gateway**:
   - All network calls are isolated into `frontend/api/` (`authApi.js`, `grievanceApi.js`, `departmentApi.js`, `analyticsApi.js`, `notificationApi.js`).
   - UI components never make inline `fetch` or `axios` calls; they consume dedicated gateway functions.

3. **Multi-Input Photo & Camera Evidence**:
   - `PhotoUploader` supports both direct file uploads and live camera capture (`navigator.mediaDevices.getUserMedia` / device photo capture) for citizens registering complaints and field officers attaching resolution proof.

4. **1-Click Test Role Portals**:
   - Test roles can be switched instantly via the navbar test dropdown (`Citizen`, `Field Officer`, `Department Head`, `Chief Administrator`).

---

## 🚀 Running the Project

```bash
# 1. Install all dependencies (root, backend, frontend)
npm run install:all

# 2. Start both backend (port 5000) and frontend (port 5173) concurrently
npm run dev
```

- **Frontend URL**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
