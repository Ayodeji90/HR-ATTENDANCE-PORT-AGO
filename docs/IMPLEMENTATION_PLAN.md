# GeoTrackHR — Implementation Milestone Plan

---

## PHASE 0: FOUNDATION

### M0 — Architecture & Technology Stack ✅ DONE
- **Stack decided:** Node.js + Express + TypeScript + PostgreSQL (Backend), React + TypeScript + Tailwind CSS (Admin Dashboard), React Native + TypeScript (Mobile App)
- **Monorepo structure:** `geotrackhr-backend/`, `geotrackhr-frontend/`, `geotrackhr-mobile/`
- **Directory scaffold created**

---

### M1 — Root Configs & Monorepo Scaffold ✅ DONE
| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1.1 | Root `package.json` with workspaces | `package.json` | ✅ |
| 1.2 | Root `.gitignore` | `.gitignore` | ✅ |
| 1.3 | Root `README.md` | `README.md` | ✅ |
| 1.4 | `docker-compose.yml` (PostgreSQL + Redis + API) | `docker-compose.yml` | ✅ |
| 1.5 | Backend `package.json` + dependencies | `geotrackhr-backend/package.json` | ✅ |
| 1.6 | Backend `tsconfig.json` | `geotrackhr-backend/tsconfig.json` | ✅ |
| 1.7 | Backend `.env.example` + `.env` | `geotrackhr-backend/.env.example`, `.env` | ✅ |
| 1.8 | Frontend `package.json` + Vite config | `geotrackhr-frontend/package.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js` | ✅ |
| 1.9 | Mobile `package.json` + RN config | `geotrackhr-mobile/package.json`, `tsconfig.json` | ✅ |

---

## PHASE 1: BACKEND CORE

### M2-BE — Database Schema & Migrations ✅
| # | Task | File(s) | Status |
|---|------|---------|--------|
| 2.1 | Knex/Knexfile configuration | `src/database/knexfile.ts` | ✅ |
| 2.2 | Users & Roles migration | `src/database/migrations/001_users_roles.ts` | ✅ |
| 2.3 | Employees migration | `src/database/migrations/002_employees.ts` | ✅ |
| 2.4 | Sites migration | `src/database/migrations/003_sites.ts` | ✅ |
| 2.5 | Attendance records migration | `src/database/migrations/004_attendance.ts` | ✅ |
| 2.6 | Leave requests migration | `src/database/migrations/005_leaves.ts` | ✅ |
| 2.7 | Notifications migration | `src/database/migrations/006_notifications.ts` | ✅ |
| 2.8 | Facial templates migration | `src/database/migrations/007_facial_templates.ts` | ✅ |
| 2.9 | Audit logs migration | `src/database/migrations/008_audit_logs.ts` | ✅ |
| 2.10 | Seed data (roles, demo sites, admin user) | `src/database/seeds/001_bootstrap.ts` | ✅ |
| 2.11 | Express server entry point | `src/app.ts`, `src/server.ts` | ✅ |
| 2.12 | Global error handler + logger | `src/middleware/errorHandler.ts`, `src/utils/logger.ts` | ✅ |

### M3-BE — Auth Module (JWT, RBAC, Roles) ✅
| # | Task | File(s) | Status |
|---|------|---------|--------|
| 3.1 | Auth config (JWT secret, expiry) | `src/config/auth.ts` | ✅ |
| 3.2 | Password hashing utility (argon2) | `src/utils/password.ts` | ✅ |
| 3.3 | User model + types | `src/modules/auth/user.model.ts` | ✅ |
| 3.4 | Register endpoint | `src/modules/auth/auth.controller.ts` | ✅ |
| 3.5 | Login endpoint (JWT generation) | `src/modules/auth/auth.controller.ts` | ✅ |
| 3.6 | JWT middleware (verify token) | `src/middleware/auth.ts` | ✅ |
| 3.7 | RBAC middleware (role guard) | `src/middleware/rbac.ts` | ✅ |
| 3.8 | Refresh token endpoint | `src/modules/auth/auth.controller.ts` | ✅ |
| 3.9 | Device registration endpoint | `src/modules/auth/auth.controller.ts` | ✅ |
| 3.10 | Auth routes | `src/modules/auth/auth.routes.ts` | ✅ |
| 3.11 | User devices migration | `src/database/migrations/009_user_devices.ts` | ✅ |

### M4-BE — Employee Management CRUD ✅
| # | Task | File(s) | Status |
|---|------|---------|--------|
| 4.1 | Employee model + types | `src/modules/employee/employee.model.ts` | ✅ |
| 4.2 | Create employee (HR only) | `src/modules/employee/employee.controller.ts` | ✅ |
| 4.3 | List employees (paginated, filterable) | `src/modules/employee/employee.controller.ts` | ✅ |
| 4.4 | Get employee by ID | `src/modules/employee/employee.controller.ts` | ✅ |
| 4.5 | Update employee | `src/modules/employee/employee.controller.ts` | ✅ |
| 4.6 | Deactivate/archive employee | `src/modules/employee/employee.controller.ts` | ✅ |
| 4.7 | Self-registration (pending approval) | `src/modules/employee/employee.controller.ts` | ✅ |
| 4.8 | Approve/reject self-registration | `src/modules/employee/employee.controller.ts` | ✅ |
| 4.9 | Upload passport photograph | `src/modules/employee/employee.controller.ts` | ✅ |
| 4.10 | Employee routes | `src/modules/employee/employee.routes.ts` | ✅ |

### M5-BE — Site Management + Geofence Config ⬜
| # | Task | File(s) | Status |
|---|------|---------|--------|
| 5.1 | Site model + types | `src/modules/site/site.model.ts` | ✅ |
| 5.2 | Create site (with GPS + radius) | `src/modules/site/site.controller.ts` | ✅ |
| 5.3 | List sites (paginated) | `src/modules/site/site.controller.ts` | ✅ |
| 5.4 | Get site by ID | `src/modules/site/site.controller.ts` | ✅ |
| 5.5 | Update site (GPS, radius, status) | `src/modules/site/site.controller.ts` | ✅ |
| 5.6 | Assign employees to site | `src/modules/site/site.controller.ts` | ✅ |
| 5.7 | Remove employee from site | `src/modules/site/site.controller.ts` | ✅ |
| 5.8 | Haversine distance utility | `src/utils/geofence.ts` | ✅ |
| 5.9 | Site routes | `src/modules/site/site.routes.ts` | ✅ |

### M6-BE — Attendance + GPS Geofencing Engine ⬜
| # | Task | File(s) | Status |
|---|------|---------|--------|
| 6.1 | Attendance model + types | `src/modules/attendance/attendance.model.ts` | ✅ |
| 6.2 | Morning check-in (GPS verify + time window) | `src/modules/attendance/attendance.controller.ts` | ✅ |
| 6.3 | Geofence validation logic | `src/modules/attendance/attendance.controller.ts` | ✅ |
| 6.4 | Late attendance handling (9:01-10:00) | `src/modules/attendance/attendance.controller.ts` | ✅ |
| 6.5 | Pending attendance (after 10:00) | `src/modules/attendance/attendance.controller.ts` | ✅ |
| 6.6 | Afternoon site confirmation (2:00-3:00 PM) | `src/modules/attendance/attendance.controller.ts` | ✅ |
| 6.7 | Evening check-out (5:00-10:00 PM) | `src/modules/attendance/attendance.controller.ts` | ✅ |
| 6.8 | Approve/reject pending attendance | `src/modules/attendance/attendance.controller.ts` | ✅ |
| 6.9 | Get employee attendance history | `src/modules/attendance/attendance.controller.ts` | ✅ |
| 6.10 | Get daily attendance summary (per site) | `src/modules/attendance/attendance.controller.ts` | ✅ |
| 6.11 | Offline sync endpoint (batch upload) | `src/modules/attendance/attendance.controller.ts` | ✅ |
| 6.12 | Attendance routes | `src/modules/attendance/attendance.routes.ts` | ✅ |

### M7-BE — Facial Verification Module ⬜
| # | Task | File(s) | Status |
|---|------|---------|--------|
| 7.1 | Facial template model | `src/modules/facial/facial.model.ts` | ✅ |
| 7.2 | Register facial images (multi-angle) | `src/modules/facial/facial.controller.ts` | ✅ |
| 7.3 | Generate facial template (placeholder AI) | `src/modules/facial/facial.controller.ts` | ✅ |
| 7.4 | Verify live selfie vs stored template | `src/modules/facial/facial.controller.ts` | ✅ |
| 7.5 | Facial verification integrated into check-in | `src/modules/attendance/attendance.controller.ts` | ✅ |
| 7.6 | Facial routes | `src/modules/facial/facial.routes.ts` | ✅ |

### M8-BE — Leave Management Workflows ⬜
| # | Task | File(s) | Status |
|---|------|---------|--------|
| 8.1 | Leave model + types (all leave types) | `src/modules/leave/leave.model.ts` | ✅ |
| 8.2 | Submit leave request | `src/modules/leave/leave.controller.ts` | ✅ |
| 8.3 | Supervisor approval step | `src/modules/leave/leave.controller.ts` | ✅ |
| 8.4 | HR final approval step | `src/modules/leave/leave.controller.ts` | ✅ |
| 8.5 | Reject leave (with reason) | `src/modules/leave/leave.controller.ts` | ✅ |
| 8.6 | Get employee leave history | `src/modules/leave/leave.controller.ts` | ✅ |
| 8.7 | Get pending leave approvals | `src/modules/leave/leave.controller.ts` | ✅ |
| 8.8 | Leave balance calculation | `src/modules/leave/leave.controller.ts` | ✅ |
| 8.9 | Upload supporting document | `src/modules/leave/leave.controller.ts` | ✅ |
| 8.10 | Leave routes | `src/modules/leave/leave.routes.ts` | ✅ |

### M9-BE — Notifications + Reports Engine ⬜
| # | Task | File(s) | Status |
|---|------|---------|--------|
| 9.1 | Notification model | `src/modules/notification/notification.model.ts` | ✅ |
| 9.2 | Create notification (internal) | `src/modules/notification/notification.controller.ts` | ✅ |
| 9.3 | Get user notifications | `src/modules/notification/notification.controller.ts` | ✅ |
| 9.4 | Mark notification as read | `src/modules/notification/notification.controller.ts` | ✅ |
| 9.5 | Notification triggers (attendance, leave, etc.) | `src/modules/notification/notification.service.ts` | ✅ |
| 9.6 | Daily attendance report | `src/modules/report/report.controller.ts` | ✅ |
| 9.7 | Site attendance report | `src/modules/report/report.controller.ts` | ✅ |
| 9.8 | Employee attendance history report | `src/modules/report/report.controller.ts` | ✅ |
| 9.9 | Monthly attendance summary (payroll export) | `src/modules/report/report.controller.ts` | ✅ |
| 9.10 | Leave balance report | `src/modules/report/report.controller.ts` | ✅ |
| 9.11 | Notification + Report routes | `src/modules/notification/`, `src/modules/report/` | ✅ |

---

## PHASE 2: FRONTEND ADMIN DASHBOARD

### M10-FE — React Dashboard Setup + Auth Pages ✅
| # | Task | File(s) | Status |
|---|------|---------|--------|
| 10.1 | Vite + React + Tailwind setup | `vite.config.ts`, `tailwind.config.js` | ✅ |
| 10.2 | App router (React Router) | `src/App.tsx` | ✅ |
| 10.3 | API service layer (axios) | `src/services/api.ts` | ✅ |
| 10.4 | Auth store (Zustand/Context) | `src/store/authStore.ts` | ✅ |
| 10.5 | Login page | `src/pages/Login.tsx` | ✅ |
| 10.6 | Protected route wrapper | `src/components/ProtectedRoute.tsx` | ✅ |
| 10.7 | Dashboard layout (sidebar + header) | `src/components/Layout.tsx` | ✅ |
| 10.8 | Role-based navigation | `src/components/Sidebar.tsx` | ✅ |
| 10.9 | Shared UI components (Button, Modal, Table) | `src/components/ui/` | ✅ |

### M11-FE — Employee & Site Management UI ⬜
| # | Task | File(s) | Status |
|---|------|---------|--------|
| 11.1 | Employee list page (table + filters) | `src/pages/Employees.tsx` | ✅ |
| 11.2 | Employee detail/edit page | `src/pages/EmployeeDetail.tsx` | ✅ |
| 11.3 | Employee create form | `src/pages/EmployeeCreate.tsx` | ✅ |
| 11.4 | Self-registration approval queue | `src/pages/PendingRegistrations.tsx` | ✅ |
| 11.5 | Site list page (with map preview) | `src/pages/Sites.tsx` | ✅ |
| 11.6 | Site detail/edit page | `src/pages/SiteDetail.tsx` | ✅ |
| 11.7 | Site create form (GPS picker) | `src/pages/SiteCreate.tsx` | ✅ |
| 11.8 | Assign employees to site UI | `src/pages/SiteAssignments.tsx` | ✅ |

### M12-FE — Attendance Monitoring + Approvals UI ✅
| # | Task | File(s) | Status |
|---|------|---------|--------|
| 12.1 | Live attendance dashboard | `src/pages/AttendanceDashboard.tsx` | ✅ |
| 12.2 | Daily attendance by site view | `src/pages/DailyAttendance.tsx` | ✅ |
| 12.3 | Pending attendance approval queue | `src/pages/PendingAttendance.tsx` | ✅ |
| 12.4 | Approve/reject pending attendance | `src/components/AttendanceApproval.tsx` | ✅ |
| 12.5 | Location mismatch alerts | `src/pages/LocationAlerts.tsx` | ✅ |
| 12.6 | Employee attendance history view | `src/pages/EmployeeAttendance.tsx` | ✅ |

### M13-FE — Leave Management + Reports Dashboard ⬜
| # | Task | File(s) | Status |
|---|------|---------|--------|
| 13.1 | Leave approval queue | `src/pages/LeaveApprovals.tsx` | ✅ |
| 13.2 | Leave request detail + approve/reject | `src/components/LeaveApproval.tsx` | ✅ |
| 13.3 | Employee leave history | `src/pages/EmployeeLeaves.tsx` | ✅ |
| 13.4 | Reports dashboard (charts) | `src/pages/Reports.tsx` | ✅ |
| 13.5 | Daily attendance report | `src/components/reports/DailyReport.tsx` | ✅ |
| 13.6 | Site attendance report | `src/components/reports/SiteReport.tsx` | ✅ |
| 13.7 | Monthly summary + payroll export | `src/components/reports/MonthlyReport.tsx` | ✅ |
| 13.8 | Audit log viewer | `src/pages/AuditLogs.tsx` | ✅ |
| 13.9 | System settings page | `src/pages/Settings.tsx` | ✅ |

---

## PHASE 3: MOBILE APPLICATION

### M14-MOB — React Native Scaffold + Auth Screens ⬜
| # | Task | File(s) | Status |
|---|------|---------|--------|
| 14.1 | React Native project init | `package.json`, `app.json` | ⬜ |
| 14.2 | Navigation setup (React Navigation) | `src/navigation/` | ⬜ |
| 14.3 | API service layer | `src/services/api.ts` | ⬜ |
| 14.4 | Auth store (Zustand + AsyncStorage) | `src/store/authStore.ts` | ⬜ |
| 14.5 | Login screen | `src/screens/LoginScreen.tsx` | ⬜ |
| 14.6 | Self-registration screen | `src/screens/RegisterScreen.tsx` | ⬜ |
| 14.7 | Profile screen | `src/screens/ProfileScreen.tsx` | ⬜ |
| 14.8 | Home/dashboard screen | `src/screens/HomeScreen.tsx` | ⬜ |
| 14.9 | Shared UI components | `src/components/` | ⬜ |

### M15-MOB — Attendance Check-in/Out + GPS Capture ⬜
| # | Task | File(s) | Status |
|---|------|---------|--------|
| 15.1 | GPS location hook | `src/hooks/useLocation.ts` | ⬜ |
| 15.2 | Morning check-in screen | `src/screens/CheckInScreen.tsx` | ⬜ |
| 15.3 | Site selector component | `src/components/SiteSelector.tsx` | ⬜ |
| 15.4 | Afternoon confirmation screen | `src/screens/AfternoonConfirmScreen.tsx` | ⬜ |
| 15.5 | Evening check-out screen | `src/screens/CheckOutScreen.tsx` | ⬜ |
| 15.6 | Attendance status display | `src/components/AttendanceStatus.tsx` | ⬜ |
| 15.7 | Attendance history screen | `src/screens/AttendanceHistoryScreen.tsx` | ⬜ |
| 15.8 | Late attendance reason form | `src/components/LateReasonForm.tsx` | ⬜ |

### M16-MOB — Leave Requests + Notifications ⬜
| # | Task | File(s) | Status |
|---|------|---------|--------|
| 16.1 | Leave request form screen | `src/screens/LeaveRequestScreen.tsx` | ⬜ |
| 16.2 | Leave status/history screen | `src/screens/LeaveStatusScreen.tsx` | ⬜ |
| 16.3 | Document upload component | `src/components/DocumentUpload.tsx` | ⬜ |
| 16.4 | Notifications screen | `src/screens/NotificationsScreen.tsx` | ⬜ |
| 16.5 | Push notification setup | `src/services/notifications.ts` | ⬜ |

### M17-MOB — Offline Mode + Facial Capture ⬜
| # | Task | File(s) | Status |
|---|------|---------|--------|
| 17.1 | Offline storage service (AsyncStorage queue) | `src/services/offlineStorage.ts` | ⬜ |
| 17.2 | Offline attendance capture | `src/screens/CheckInScreen.tsx` (enhance) | ⬜ |
| 17.3 | Sync queue manager | `src/services/syncManager.ts` | ⬜ |
| 17.4 | Camera/facial capture component | `src/components/FacialCapture.tsx` | ⬜ |
| 17.5 | Facial registration screen | `src/screens/FacialRegistrationScreen.tsx` | ⬜ |
| 17.6 | Network status hook | `src/hooks/useNetworkStatus.ts` | ⬜ |

---

## PHASE 4: DEPLOYMENT & INTEGRATION

### M18 — Docker, Deployment & Final Integration ⬜
| # | Task | File(s) | Status |
|---|------|---------|--------|
| 18.1 | Backend Dockerfile | `docker/Dockerfile.backend` | ⬜ |
| 18.2 | Frontend Dockerfile (nginx serve) | `docker/Dockerfile.frontend` | ⬜ |
| 18.3 | docker-compose.yml (all services) | `docker-compose.yml` | ⬜ |
| 18.4 | Nginx reverse proxy config | `docker/nginx.conf` | ⬜ |
| 18.5 | Environment variable documentation | `docs/ENV_VARIABLES.md` | ⬜ |
| 18.6 | API documentation (OpenAPI/Swagger) | `docs/API.md` | ⬜ |
| 18.7 | Final integration test checklist | `docs/INTEGRATION_TESTS.md` | ⬜ |
| 18.8 | Production deployment guide | `docs/DEPLOYMENT.md` | ⬜ |

---

## STATUS SUMMARY

| Phase | Milestone | Status |
|-------|-----------|--------|
| 0 | M0 — Architecture & Stack | ✅ Complete |
| 0 | M1 — Root Configs & Scaffold | ✅ Complete |
| 1 | M2-BE — Database Schema | ✅ Complete |
| 1 | M3-BE — Auth Module | ✅ Complete |
| 1 | M4-BE — Employee Management | ⬜ Pending |
| 1 | M5-BE — Site Management | ⬜ Pending |
| 1 | M6-BE — Attendance & Geofencing | ⬜ Pending |
| 1 | M7-BE — Facial Verification | ⬜ Pending |
| 1 | M8-BE — Leave Management | ⬜ Pending |
| 1 | M9-BE — Notifications & Reports | ⬜ Pending |
| 2 | M10-FE — Dashboard Setup | ⬜ Pending |
| 2 | M11-FE — Employee & Site UI | ⬜ Pending |
| 2 | M12-FE — Attendance UI | ⬜ Pending |
| 2 | M13-FE — Leave & Reports UI | ⬜ Pending |
| 3 | M14-MOB — RN Scaffold | ⬜ Pending |
| 3 | M15-MOB — Attendance Screens | ⬜ Pending |
| 3 | M16-MOB — Leave & Notifications | ⬜ Pending |
| 3 | M17-MOB — Offline & Facial | ⬜ Pending |
| 4 | M18 — Docker & Deployment | ⬜ Pending |

---

*Last updated: 2026-07-08*