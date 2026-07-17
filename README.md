# GeoTrackHR

**Smart Geo-Verified Attendance, Leave & Workforce Management System for Construction Organizations**

## Overview
GeoTrackHR is a comprehensive HR and Workforce Management System that leverages GPS geofencing, facial verification, and workflow automation to ensure genuine, location-based employee attendance across multiple construction sites.

## Architecture

```
geotrackhr/
├── geotrackhr-backend/     # Node.js + Express + TypeScript API
├── geotrackhr-frontend/    # React + Tailwind CSS Admin Dashboard
├── geotrackhr-mobile/      # React Native Mobile App
├── docker/                 # Docker configs
└── docs/                   # Documentation
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express, TypeScript, PostgreSQL, Knex |
| Auth | JWT (access + refresh tokens), Argon2 hashing, RBAC |
| Frontend | React 18, TypeScript, Tailwind CSS, Vite, Zustand |
| Mobile | React Native, React Navigation, AsyncStorage |
| Infrastructure | Docker, Docker Compose, Nginx |

## Quick Start

### Prerequisites
- Node.js >= 18
- PostgreSQL 14+
- Docker (optional)

### Setup

```bash
# Install all dependencies
npm install

# Copy environment file
cp geotrackhr-backend/.env.example geotrackhr-backend/.env
# Edit .env with your database credentials

# Run database migrations
npm run db:migrate
npm run db:seed

# Start backend (port 3000)
npm run dev:backend

# Start frontend (port 5173)
npm run dev:frontend
```

### Docker

```bash
npm run docker:up    # Start PostgreSQL + Backend + Frontend
npm run docker:down  # Stop all services
```

## Core Modules

- **Auth & RBAC** — JWT authentication with 7 role levels
- **Employee Management** — Full CRUD with self-registration approval flow
- **Site Management** — GPS-defined sites with geofence radius
- **Attendance** — GPS-verified check-in/out with late/pending workflows
- **Facial Verification** — Anti-buddy-punching biometric verification
- **Leave Management** — Multi-step approval (Supervisor → HR)
- **Notifications** — Push, email, and in-app alerts
- **Reports** — Daily, site, employee, and monthly payroll exports

## Documentation

- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md)
- [API Documentation](docs/API.md) (coming soon)
- [Deployment Guide](docs/DEPLOYMENT.md) (coming soon)

## License

Proprietary — All rights reserved.