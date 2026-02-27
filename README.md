# WorkSmart HR — Frontend

> A modern, role-based Human Resource and Payroll Management System built for Ghanaian businesses.

![Angular](https://img.shields.io/badge/Angular-17+-DD0031?style=flat&logo=angular)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?style=flat&logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=flat)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [User Roles](#user-roles)
- [Available Scripts](#available-scripts)
- [API Integration](#api-integration)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

WorkSmart HR is a full-featured HR and Payroll Management System designed specifically for organisations operating in Ghana. This repository contains the **frontend application** built with Angular. It provides role-based dashboards, an employee self-service portal, payroll interfaces, leave and attendance management, and compliance reporting — all in one responsive web and mobile-ready interface.

The backend API repository can be found at: [worksmart-hr-backend](https://github.com/your-org/worksmart-hr-backend)

---

## Features

- **Role-Based Dashboards** — Distinct views for Admin, HR Manager, Finance Officer, Department Head, Employee, and Auditor
- **Employee Management** — Create, update, and manage employee profiles and documents
- **Recruitment & Onboarding** — Manage job listings, applicant pipelines, and digital onboarding
- **Attendance Tracking** — Web and mobile clock in/out with GPS support
- **Leave Management** — Apply, approve, and track leave requests in real time
- **Payroll Interface** — Initiate payroll runs, review deductions, and download payslips
- **Employee Self-Service Portal (ESS)** — Employees manage their own payslips, leave, and profile
- **Performance & Appraisals** — KPI tracking, goal setting, and performance reviews
- **Reports & Analytics** — Visual dashboards with export to PDF, Excel, and CSV
- **Notifications** — In-app and email alerts for approvals, payroll, and deadlines
- **Responsive Design** — Fully optimised for desktop, tablet, and mobile

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 17+ (Standalone Components) |
| Styling | TailwindCSS 3.x |
| State Management | Angular Signals / NgRx |
| HTTP Client | Angular HttpClient |
| Forms | Angular Reactive Forms |
| Charts | ApexCharts |
| Authentication | JWT with HTTP Interceptors |
| Mobile | Capacitor (Android & iOS) |
| Testing | Jest / Karma |
| Linting | ESLint + Prettier |

---

## Project Structure

```
src/
├── app/
│   ├── core/                  # Auth service, interceptors, guards, base models
│   ├── shared/                # Reusable components, pipes, directives, UI kit
│   ├── layout/                # Sidebar, topbar, shell, page wrapper
│   └── features/
│       ├── auth/              # Login, forgot password, 2FA
│       ├── dashboard/         # Role-based landing pages
│       ├── employees/         # Employee list, profile, add/edit forms
│       ├── recruitment/       # Job listings, applicant pipeline, onboarding
│       ├── attendance/        # Clock in/out, daily log, attendance calendar
│       ├── leave/             # Leave requests, approvals, balance overview
│       ├── payroll/           # Payroll run, payslip viewer, reports
│       ├── performance/       # Appraisal periods, KPIs, ratings
│       ├── reports/           # Report builder, filters, chart views
│       └── settings/          # System settings, user profile, preferences
├── environments/
│   ├── environment.ts
│   └── environment.production.ts
├── assets/
└── styles/
```

---

## Getting Started

### Prerequisites

- Node.js >= 18.x
- npm >= 9.x or yarn
- Angular CLI >= 17.x

```bash
npm install -g @angular/cli
```

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/worksmart-hr-frontend.git
cd worksmart-hr-frontend

# Install dependencies
npm install

# Start development server
ng serve
```

The application will be available at `http://localhost:4200`.

> Make sure the backend server is running. See the [backend repository](https://github.com/your-org/worksmart-hr-backend) for setup instructions.

---

## Environment Configuration

Create or update the environment files before running the application.

**`src/environments/environment.ts`**
```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000/api/v1',
  appName: 'WorkSmart HR',
};
```

**`src/environments/environment.production.ts`**
```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'https://your-production-api.com/api/v1',
  appName: 'WorkSmart HR',
};
```

### Proxy Configuration (Development)

To avoid CORS issues during local development, a proxy config is included:

**`proxy.conf.json`**
```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  }
}
```

Run with proxy:
```bash
ng serve --proxy-config proxy.conf.json
```

---

## User Roles

| Role | Access Level |
|---|---|
| System Admin | Full system access, user management, audit logs |
| HR Manager | Employee records, leave management, approvals, reports |
| Finance Officer | Payroll processing, payslip generation, compliance exports |
| Department Head | Team attendance, leave approvals, performance reviews |
| Employee | Self-service portal (payslips, leave, profile, attendance) |
| Auditor | Read-only access to logs and compliance reports |

Route guards enforce role-based access on every protected page.

---

## Available Scripts

```bash
# Start development server
ng serve

# Build for production
ng build --configuration production

# Run unit tests
ng test

# Run linting
ng lint

# Generate a new feature module
ng generate module features/module-name

# Build mobile app (Capacitor)
npx cap sync
npx cap open android
```

---

## API Integration

All API requests are made to the backend using the `apiBaseUrl` defined in the environment file. Every authenticated request automatically attaches the JWT token via an HTTP interceptor.

Base URL pattern:
```
/api/v1/{resource}
```

Example endpoints consumed by the frontend:

```
POST   /api/v1/auth/login
GET    /api/v1/employees
POST   /api/v1/employees
GET    /api/v1/payroll/run
POST   /api/v1/leave/request
GET    /api/v1/reports/payroll
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: describe your change"`
4. Push to your branch: `git push origin feature/your-feature-name`
5. Open a Pull Request against the `develop` branch

Please follow the [Angular commit message convention](https://www.conventionalcommits.org/) and ensure all tests pass before submitting.

---

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

---

> Built for Ghana. Designed for growth. Powered by WorkSmart HR.
