# AGENT.md

## WorkSmart HRMS — AI Agent Instructions

These instructions apply to all repositories associated with the WorkSmart HRMS project.

Every AI agent, developer assistant, or automated coding tool working on this project must follow these rules before suggesting, editing, generating, refactoring, or deleting code.

WorkSmart HRMS is a SaaS Human Resource Management System. It must be built with strong attention to:

1. Reliability
2. Scalability
3. Performance
4. Security

Do not add features in a way that weakens these four goals.

---

## 1. Core Project Understanding

WorkSmart HRMS is a SaaS platform that allows multiple companies to manage HR operations from one system.

The system may include:

* Tenant and company management
* Authentication
* User management
* Role and permission management
* Employee management
* Department and job title management
* Leave management
* Attendance management
* Payroll management
* Recruitment
* Onboarding
* Offboarding
* Performance management
* Document management
* Notifications
* Reports and analytics
* Audit logs
* Subscription and billing
* Compliance and data protection

The most important system rule is:

**One company must never access another company’s data.**

Every implementation must protect:

* Tenant isolation
* User permissions
* Sensitive HR data
* Audit history
* Production stability
* System performance
* Secure data access
* Long-term maintainability

---

## 2. Main Agent Behaviour Rules

### 2.1 Do Not Guess Business Logic

Do not invent business rules silently.

If the existing code, documentation, or task description does not clearly define the business rule, do one of the following:

1. Follow the existing project pattern.
2. Make the safest assumption.
3. Clearly state the assumption.
4. Ask for clarification when required.

Do not create hidden rules that are not documented.

---

### 2.2 Do Not Break Existing Architecture

Before changing code, inspect the existing structure and follow it.

Do not introduce a new pattern when an existing project pattern already solves the problem.

Do not rewrite large parts of the system unless the task specifically asks for it.

Prefer small, focused, reviewable changes.

---

### 2.3 Do Not Hallucinate Files, Assets, APIs, or Components

Only use what exists in the repository, what is visible in the design, or what the user explicitly provides.

Do not invent:

* API endpoints
* Component names
* Service methods
* Translation keys
* Assets
* Images
* Icons
* Database fields
* Permission names
* Environment variables
* Routes
* Middleware
* Configuration files

If something is missing, mention that it is missing and suggest the safest next step.

---

### 2.4 Use the Correct Repository

When a task requires communication with the backend, inspect and use the backend repository instead of guessing from online examples.

When a task requires frontend changes, inspect and use the frontend repository structure.

Do not scout online for project-specific backend contracts when the backend repository exists in the project.

---

### 2.5 Preserve Security Boundaries

Never assume the frontend is secure.

The frontend is only for presentation and user interaction.

The backend is the business authority.

The database is the final protection layer.

A hidden frontend button is not security. Backend permission checks are required.

---

## 3. Architecture Principles

The system should follow this general flow:

```text
User
→ Frontend Application
→ API Gateway or Backend API
→ Authentication Middleware
→ Tenant Resolution Middleware
→ Permission Middleware
→ Business Service Layer
→ Database / Storage / Cache / Queue
→ Audit Log
→ Response to User
```

For heavy tasks, the system should follow this flow:

```text
User
→ Frontend Application
→ Backend API
→ Validate request
→ Create job record
→ Add job to queue
→ Return 202 Accepted
→ Worker processes job
→ Worker updates job status
→ Notification is sent
→ User downloads or views result
```

Do not run heavy work directly inside normal HTTP requests.

---

## 4. Frontend Instructions

### 4.1 Frontend Responsibility

The frontend may:

* Render pages
* Display data
* Collect user input
* Show validation hints
* Call backend APIs
* Show loading states
* Show error states
* Show empty states
* Show success states
* Hide or disable unavailable actions
* Support responsive layouts
* Support accessibility
* Use translations correctly

The frontend must not:

* Store secret keys
* Store database credentials
* Make final permission decisions
* Calculate final payroll values
* Calculate final billing values
* Approve sensitive business actions by itself
* Trust hidden buttons as access control
* Expose internal infrastructure details

---

### 4.2 Dynamic UI State Rule

Every dynamic UI that loads data must handle four states:

1. Loading
2. Error
3. Empty
4. Success

Example:

```text
Employee table

Loading: show skeleton rows or spinner
Error: show a helpful error message
Empty: show “No employees found”
Success: show the employee list
```

Do not create a page that assumes API data will always load successfully.

---

### 4.3 Frontend Validation Rule

Frontend validation improves user experience only.

Backend validation is still required.

Example:

```text
Frontend:
“This field is required.”

Backend:
“This field is required, the value is valid, and the user has permission to submit it.”
```

Do not rely only on frontend validation.

---

### 4.4 Permission Display Rule

The frontend may hide or disable actions based on permissions returned from the backend.

However, every sensitive action must still be protected by the backend.

Bad approach:

```text
Hide the Delete button only in the frontend.
```

Correct approach:

```text
Frontend hides the Delete button.
Backend checks employee.delete permission.
Backend checks tenant access.
Backend writes audit log.
```

---

### 4.5 Frontend Environment Rule

Any environment variable shipped to the frontend is public.

Never put these in frontend-exposed variables:

```text
DATABASE_URL
JWT_SECRET
STRIPE_SECRET_KEY
AWS_SECRET_ACCESS_KEY
PRIVATE_ENCRYPTION_KEY
WEBHOOK_SECRET
```

Frontend environment variables may contain public values such as:

```text
API base URL
Public analytics key
Public app name
Public feature flag
```

---

### 4.6 UI and Design Rule

When implementing UI:

* Match the provided design as closely as possible.
* Do not hallucinate missing content.
* Do not generate missing assets unless explicitly asked.
* Use only assets available in the project or provided by the user.
* Keep spacing, typography, visual states, and responsive behaviour consistent.
* Use accessible contrast and visible focus states.
* Preserve Bootstrap, design tokens, Google Fonts, and Google Icons conventions where the project uses them.
* Focus on UI implementation details when working on layout or design tasks.
* Do not turn UI implementation tasks into broad UX strategy unless explicitly asked.

---

### 4.7 Angular Architecture Reference

This portal follows strict Angular architectural conventions documented in two companion files that **must** be consulted before adding or modifying any Angular feature:

- [`ANGULAR_APP_STRUCTURE_TEMPLATE.md`](./ANGULAR_APP_STRUCTURE_TEMPLATE.md) — defines the canonical folder structure, abstract base classes (`CollectionService<T>`, `PaginatedTableComponent<T>`, `EditingFormComponent<I,O>`), UI library split (PrimeNG vs Angular Material), toast and confirmation patterns, permission directives, routing conventions, and a step-by-step recipe for new features.
- [`ANGULAR_NEW_FEATURE_AGENT_PROMPT.md`](./ANGULAR_NEW_FEATURE_AGENT_PROMPT.md) — a ready-to-use AI agent prompt template that hands the structure template to a coding agent (Claude Code, Cursor, etc.) to scaffold a new CRUD feature. Fill in the placeholders before running it.

Do not invent new structural patterns that conflict with what these files define. If the existing base classes do not cover a new need, extend them rather than bypassing them.

---

## 5. Backend Instructions

### 5.1 Backend Responsibility

The backend is responsible for:

* Authentication
* Authorization
* Tenant resolution
* Permission checks
* Business rules
* Input validation
* Payroll calculations
* Leave balance updates
* Subscription access
* File access
* Database transactions
* Background job creation
* Error handling
* Rate limiting
* Audit logging

The backend must never trust the frontend blindly.

---

### 5.2 API Endpoint Rule

Every sensitive API endpoint must follow this flow:

```text
1. Validate authentication.
2. Resolve the active tenant.
3. Check that the user belongs to the tenant.
4. Check the required permission.
5. Validate the request body, params, and query.
6. Execute the business logic.
7. Use a transaction when multiple related records change.
8. Write an audit log where required.
9. Return a consistent response.
```

---

### 5.3 Standard API Response Rule

Use consistent API responses.

Successful response example:

```json
{
  "success": true,
  "message": "Employee created successfully.",
  "data": {}
}
```

Error response example:

```json
{
  "success": false,
  "message": "You do not have permission to perform this action.",
  "errorCode": "FORBIDDEN"
}
```

Do not expose internal stack traces, database errors, secrets, or infrastructure details to users.

---

### 5.4 Heavy Work Rule

Do not process heavy tasks inside normal request-response cycles.

Move the following to background jobs:

* Payroll generation
* Payslip generation
* Large report exports
* Bulk employee imports
* Attendance device sync
* Email notification batches
* Document processing
* Data cleanup
* Subscription usage aggregation
* Invoice generation

Correct flow:

```text
User starts action
→ Backend validates request
→ Backend creates job
→ Backend returns jobId
→ Worker processes job
→ User gets status update or notification
```

---

## 6. Database Instructions

### 6.1 Tenant Identifier Rule

Every tenant-owned table must include a tenant identifier.

Examples of tenant-owned tables:

```text
employees
departments
job_titles
leave_requests
attendance_records
payroll_records
documents
notifications
audit_logs
invoices
subscriptions
usage_events
```

Required common fields:

```text
tenantId
createdAt
updatedAt
createdBy
updatedBy
deletedAt
```

Do not query tenant-owned data without tenant filtering.

Bad example:

```sql
SELECT * FROM employees;
```

Correct example:

```sql
SELECT * FROM employees
WHERE tenant_id = :currentTenantId;
```

---

### 6.2 Database Migration Rule

All database changes must use version-controlled migrations.

Do not manually change production database structure.

Do not create schema changes without considering:

* Tenant isolation
* Indexes
* Foreign keys
* Soft delete
* Audit requirements
* Data migration safety
* Rollback strategy

---

### 6.3 Indexing Rule

Add indexes for common filters and joins.

Common index candidates:

```text
tenantId
employeeId
departmentId
status
createdAt
updatedAt
date
attendanceDate
leaveRequestStatus
```

Example indexes:

```sql
CREATE INDEX idx_employees_tenant_id ON employees(tenant_id);
CREATE INDEX idx_employees_department_id ON employees(department_id);
CREATE INDEX idx_leave_requests_tenant_status ON leave_requests(tenant_id, status);
CREATE INDEX idx_attendance_tenant_date ON attendance_records(tenant_id, attendance_date);
CREATE INDEX idx_audit_logs_tenant_created_at ON audit_logs(tenant_id, created_at);
```

Do not add indexes blindly. Index fields that are actually used for filtering, sorting, joining, or lookup.

---

### 6.4 Soft Delete Rule

Sensitive HR records should not be permanently deleted immediately.

Use soft delete where appropriate:

```text
deletedAt
deletedBy
deleteReason
```

This supports recovery, audit review, and compliance.

---

## 7. Tenant and SaaS Instructions

### 7.1 Tenant Isolation Rule

Company A must never access Company B’s data.

Tenant isolation must be enforced in:

1. Authentication
2. Backend services
3. Database queries
4. Row-Level Security where possible
5. File storage rules
6. Audit logs
7. Background jobs
8. Reports and exports

Never bypass tenant filtering for convenience.

---

### 7.2 Recommended Tenant Model

Start with:

```text
Shared database
Shared schema
tenantId on every tenant-owned table
Strict backend tenant filtering
Database Row-Level Security where possible
```

Later, for large enterprise clients, the system may support:

```text
Dedicated schema per tenant
or
Dedicated database per tenant
```

Do not introduce physical sharding too early unless there is a proven scale problem.

---

### 7.3 Tenant Resolution Flow

Use this flow:

```text
User logs in
→ Token/session identifies user
→ Backend resolves user tenant
→ Every request is scoped to active tenant
→ Every tenant-owned query filters by tenantId
→ Every permission is checked within tenant scope
```

---

## 8. Authentication and Authorization Instructions

### 8.1 Authentication Features

The system should support:

* Login
* Logout
* Forgot password
* Password reset
* Email verification
* Multi-factor authentication for admins
* Session timeout
* Refresh token rotation
* Logout from all devices
* Device/session management

---

### 8.2 Authorization Model

Use role-based access control together with permission-based access control.

Example roles:

```text
SaaS Super Admin
Company Owner
HR Admin
HR Officer
Manager
Employee
Payroll Officer
Finance Officer
Recruiter
Auditor
```

Example permissions:

```text
employee.create
employee.view
employee.update
employee.delete
leave.approve
leave.reject
payroll.process
payroll.view
report.export
document.upload
document.download
settings.manage
```

---

### 8.3 Permission Check Rule

Do not rely only on role names.

Bad example:

```text
if user.role == "Admin"
```

Better approach:

```text
if user has permission "employee.update"
```

Permission-based checks are more flexible and safer as the system grows.

---

## 9. Security Instructions

### 9.1 Security Must-Haves

The system must include:

* HTTPS/TLS
* Secure password hashing
* MFA for administrators
* Backend permission checks
* Tenant isolation
* Input validation
* Output sanitization
* Rate limiting
* Secure file upload
* Private file storage
* Signed URLs for private documents
* Audit logs
* Secure error handling
* Secrets management
* Backup encryption
* Data retention rules

---

### 9.2 Password Security

Never store plain-text passwords.

Use strong password hashing such as:

```text
Argon2
or
bcrypt
```

---

### 9.3 Secrets Rule

Never commit secrets to the repository.

Never expose secrets in frontend code.

Never log secrets.

Secrets include:

```text
Database URLs
JWT signing secrets
Refresh token secrets
Stripe secret keys
Webhook signing secrets
AWS secret keys
Private encryption keys
SMTP passwords
OAuth client secrets
```

Use environment variables or a secrets manager.

---

### 9.4 File Upload Security

Uploaded HR documents must be protected.

The system should:

* Validate file type
* Limit file size
* Rename files internally
* Store files in private storage
* Use signed URLs for downloads
* Scan files where possible
* Log downloads
* Validate user permission before download

Sensitive files include:

* Contracts
* Payslips
* Certificates
* National IDs
* Medical-related documents
* Performance documents
* Disciplinary records

---

### 9.5 Sensitive HR Data Rule

Sensitive data requires stricter access control.

Sensitive fields include:

```text
Salary
Bank details
National ID
Passport number
Medical-related leave notes
Disciplinary records
Contracts
Payslips
Performance reviews
```

Do not expose sensitive fields in general employee responses unless the requesting user has the correct permission.

---

## 10. Reliability Instructions

### 10.1 Reliability Requirements

The system should include:

* Graceful error handling
* Retry logic
* Background jobs
* Health checks
* Automatic backups
* Restore testing
* Audit logs
* Monitoring
* Alerting
* Transaction-safe database updates
* Idempotency keys for duplicate action prevention

---

### 10.2 Health Check Rule

Add health endpoints where appropriate:

```text
GET /health
GET /health/database
GET /health/cache
GET /health/queue
GET /health/storage
```

Health checks should not expose secrets or sensitive infrastructure details.

---

### 10.3 Idempotency Rule

Important operations must protect against duplicates.

Use idempotency keys for:

* Generate payroll
* Submit payment
* Export report
* Import employees
* Approve leave
* Send offer letter
* Generate payslip
* Create invoice

Flow:

```text
Client sends request with Idempotency-Key
→ Backend checks if the key already exists
→ If yes, return existing result
→ If no, create new operation
→ Store idempotency key
→ Complete operation
```

This prevents duplicate payroll runs, duplicate payments, duplicate approvals, and duplicate reports.

---

## 11. Scalability Instructions

### 11.1 Scalability Order

Scale in this order:

```text
1. Good schema design
2. Correct indexes
3. Pagination
4. Caching
5. Background jobs
6. Connection pooling
7. Logical partitioning
8. Dedicated tenant databases
9. Physical sharding
```

Do not start with complex sharding before the product needs it.

---

### 11.2 Pagination Rule

Never fetch unlimited records from large tables.

Bad example:

```text
GET /employees
```

Correct example:

```text
GET /employees?page=1&pageSize=25&search=ama
```

Use pagination, filtering, sorting, and search limits.

For very large datasets, consider cursor-based pagination.

---

### 11.3 Large Tenant Strategy

Small and medium tenants may share one database.

Large enterprise tenants may later move to:

```text
Dedicated schema
or
Dedicated database
```

This supports better isolation, performance, and enterprise compliance.

---

## 12. Performance Instructions

### 12.1 Frontend Performance

Use:

* Lazy loading
* Route-level code splitting
* Pagination
* Virtual scrolling
* Debounced search
* Skeleton loaders
* Cached dropdown data
* Optimized images
* Efficient change detection
* Avoid unnecessary re-renders
* Avoid loading massive tables at once

---

### 12.2 Backend Performance

Use:

* Database indexes
* Pagination
* Query optimization
* Caching
* Connection pooling
* Background jobs
* Rate limiting
* Efficient serialization
* Avoid N+1 queries

---

### 12.3 Database Performance

Monitor and avoid:

* Slow queries
* Missing indexes
* Connection exhaustion
* Long-running transactions
* Table bloat
* Lock contention
* Heavy report queries running during normal requests

---

### 12.4 Cache Rule

Cache data that does not change often.

Good cache candidates:

```text
Departments
Job titles
Leave types
Permission lists
Company settings
Public holidays
Country lists
Branch lists
```

Do not cache sensitive data carelessly.

Always consider tenant isolation when caching.

Cache keys for tenant data must include tenant identity.

Bad cache key:

```text
departments
```

Correct cache key:

```text
tenant:{tenantId}:departments
```

---

## 13. Background Job and Queue Instructions

### 13.1 Use Queues for Heavy Work

Use background jobs for:

* Payroll generation
* Payslip creation
* Report exports
* Bulk employee imports
* Email sending
* Notification batches
* File processing
* Attendance sync
* Usage aggregation
* Invoice generation

---

### 13.2 Job Status Rule

Use clear job statuses:

```text
pending
processing
completed
failed
cancelled
retrying
```

Do not leave users without feedback for long-running work.

---

### 13.3 Retry Rule

Use retry logic for temporary failures.

Use exponential backoff where appropriate.

Example:

```text
Attempt 1: wait 1 second
Attempt 2: wait 2 seconds
Attempt 3: wait 4 seconds
```

After retry attempts are exhausted, mark the job as failed and provide a useful error message.

---

## 14. Billing and Subscription Instructions

### 14.1 Billing Rule

Do not hardcode billing decisions across the application.

Use centralized plan and feature rules.

Example:

```text
Plan: Starter
employeeLimit: 50
payrollEnabled: false
recruitmentEnabled: false
advancedReportsEnabled: false
```

---

### 14.2 Usage Event Rule

For usage-based billing, every billable action must create an immutable usage event.

Example usage event fields:

```text
tenantId
userId
action
creditsUsed
timestamp
metadata
```

Billing and analytics should use usage events as the source of truth.

---

### 14.3 Payment Security Rule

Do not trust frontend payment status.

Payment status must be verified by the backend through the payment provider.

Webhook events must be verified using webhook signing secrets.

Never expose payment provider secret keys in the frontend.

---

## 15. Deployment and Environment Instructions

### 15.1 Required Environments

The project should support:

```text
Development
Staging
Production
```

---

### 15.2 Branching Strategy

Use this flow:

```text
feature branch
→ dev branch
→ staging deployment
→ review and test
→ main branch
→ production deployment
```

The `main` branch should represent production.

The `dev` branch should represent staging or pre-production.

Feature branches should be used for active development.

---

### 15.3 Production Safety Rule

Do not push directly to production.

Do not test risky changes in production.

Do not manually edit production code.

Every production release should pass through:

1. Code review
2. Automated tests
3. Build verification
4. Staging test
5. Production deployment

---

## 16. Monitoring, Logging, and Audit Instructions

### 16.1 Monitoring Requirements

Monitor:

* API response time
* API error rate
* Database CPU
* Database memory
* Database connections
* Queue length
* Failed jobs
* Login failures
* Payment failures
* Storage errors
* Slow queries
* Server memory
* Disk usage

---

### 16.2 Logging Rule

Logs should help developers understand what happened.

Logs must not expose:

```text
Passwords
Tokens
Bank details
Salary values
Private keys
Full identity numbers
Sensitive documents
Webhook secrets
```

Mask or remove sensitive data before logging.

---

### 16.3 Audit Log Rule

Audit logs are mandatory for sensitive HR actions.

Log actions such as:

* User login
* Failed login
* Employee created
* Employee updated
* Salary viewed
* Salary updated
* Leave approved
* Leave rejected
* Payroll processed
* Document uploaded
* Document downloaded
* User role changed
* Permission changed
* Report exported
* Tenant settings changed

Audit logs should include:

```text
id
tenantId
actorUserId
action
resourceType
resourceId
oldValue
newValue
ipAddress
userAgent
createdAt
```

Audit logs should be append-only.

Do not create features that bypass audit logging for sensitive actions.

---

## 17. Compliance and Governance Instructions

### 17.1 Compliance Awareness

The system may handle sensitive employee, payroll, identity, and company data.

Consider:

* Data protection laws
* Employee privacy
* Payroll laws
* Tax laws
* Labour laws
* Data retention rules
* Cross-border data transfer
* Terms of Service
* Privacy Policy
* Service Level Agreement
* Third-party processor agreements

---

### 17.2 Data Deletion Rule

Do not blindly delete sensitive HR data.

The system should support:

* Account deletion requests
* Employee data deletion rules
* Data anonymization
* Data retention schedules
* Backup retention policies

Some HR records may need to be retained for legal reasons.

---

## 18. Connection Pooling and Traffic Instructions

### 18.1 Connection Pooling Rule

Use a connection pooler where needed.

Examples:

```text
PgBouncer
Supabase Supavisor
Managed cloud database pooler
```

For serverless applications, use transaction-mode pooling where possible.

---

### 18.2 Connection Limit Rule

Plan database connections carefully.

Use this rule:

```text
Max database connections must be greater than or equal to:
max pool size per instance × number of active server instances
```

Example:

```text
Database max connections: 32
Application instances: 3
Pool size per instance: 10
Total possible connections: 30
```

This is safe because 30 is less than 32.

---

## 19. Concurrent Editing Instructions

### 19.1 Conflict Prevention Rule

If multiple users can edit the same record, prevent silent overwrites.

Use version checking for important records.

Examples:

```text
Employee profile
Payroll setting
Leave policy
Company settings
```

Flow:

```text
User loads record version 3
User submits update with version 3
Backend checks current version
If current version is still 3, update succeeds
If current version is now 4, reject with conflict message
```

---

### 19.2 Event History Rule

Use event history for sensitive business records.

Examples:

* Payroll changes
* Audit logs
* Billing usage
* Permission changes

Do not overwrite important history without traceability.

---

## 20. Testing Instructions

### 20.1 Required Test Areas

When adding or changing a feature, consider tests for:

* Authentication
* Permission checks
* Tenant isolation
* Form validation
* API success responses
* API error responses
* Empty states
* Loading states
* Background job flow
* Audit logging
* Pagination
* Search
* File upload restrictions
* Sensitive data visibility

---

### 20.2 Tenant Isolation Testing

Always test that:

```text
Tenant A cannot read Tenant B data.
Tenant A cannot update Tenant B data.
Tenant A cannot delete Tenant B data.
Tenant A cannot download Tenant B files.
Tenant A cannot see Tenant B reports.
```

Tenant isolation bugs are critical security bugs.

---

## 21. Code Change Checklist

Before submitting any change, confirm the following.

### Product

* The feature belongs to the correct module.
* The feature has a clear user role.
* The feature has a clear business purpose.
* The feature has acceptance criteria.

### Frontend

* The page is responsive.
* The component has loading state.
* The component has error state.
* The component has empty state.
* The component has success state.
* The frontend does not contain secret logic.
* The frontend does not store private keys.
* The frontend handles API errors gracefully.
* Translations are added where required.
* Styling follows the existing design system.

### Backend

* The endpoint validates input.
* The endpoint checks authentication.
* The endpoint checks tenant access.
* The endpoint checks permission.
* The endpoint handles errors properly.
* The endpoint returns a consistent response.
* The endpoint writes audit logs where needed.
* Heavy work is moved to a queue.

### Database

* Tenant-owned tables include tenantId.
* Records include createdAt and updatedAt.
* Sensitive tables use soft delete where appropriate.
* Queries are indexed where needed.
* Migrations are version-controlled.
* No query bypasses tenant isolation.

### Security

* Sensitive fields are protected.
* File uploads are validated.
* Permissions are enforced on the backend.
* Rate limiting is applied where needed.
* Secrets are not committed.
* Logs do not expose private data.
* Payment and webhook secrets stay server-side.

### Performance

* Large lists are paginated.
* Expensive operations are queued.
* Slow queries are reviewed.
* Frequently used static data is cached safely.
* Search is debounced on the frontend.
* N+1 query patterns are avoided.

### Reliability

* Errors are handled gracefully.
* External API calls handle failure.
* Temporary failures use retry logic.
* Duplicate operations are protected with idempotency.
* Jobs have clear statuses.
* Audit logs are written for sensitive actions.

---

## 22. AI Agent Specific Instructions

When working as an AI coding agent:

0. For any Angular frontend task, read [`ANGULAR_APP_STRUCTURE_TEMPLATE.md`](./ANGULAR_APP_STRUCTURE_TEMPLATE.md) in full before writing or editing code. When scaffolding a new feature, use [`ANGULAR_NEW_FEATURE_AGENT_PROMPT.md`](./ANGULAR_NEW_FEATURE_AGENT_PROMPT.md) as the starting prompt.
1. Read the existing files before editing.
2. Follow the current project structure.
3. Prefer minimal, focused changes.
4. Do not rewrite unrelated code.
5. Do not remove existing behaviour unless explicitly asked.
6. Do not rename public APIs without checking usage.
7. Do not invent backend endpoints.
8. Do not invent permission names.
9. Do not invent translation keys without adding them properly.
10. Do not expose secrets.
11. Do not bypass tenant filtering.
12. Do not remove audit logging.
13. Do not run heavy work synchronously.
14. Do not add unbounded queries.
15. Do not ignore error, empty, loading, and success states.
16. Do not make production-only assumptions.
17. Do not introduce a new dependency unless necessary.
18. Do not change deployment configuration casually.
19. Do not use online examples over existing project patterns.
20. Explain important assumptions in the final response.

---

## 23. Safe Implementation Pattern

For every new feature, follow this pattern:

```text
1. Identify the module.
2. Inspect existing patterns in that module.
3. Confirm the user role and permission.
4. Confirm the tenant boundary.
5. Confirm the API contract.
6. Confirm the data model.
7. Add or update backend validation.
8. Add or update frontend UI.
9. Add loading, error, empty, and success states.
10. Add audit logging for sensitive actions.
11. Add tests where appropriate.
12. Confirm performance impact.
13. Confirm security impact.
14. Summarize what changed.
```

---

## 24. Final Non-Negotiable Rule

If a change weakens tenant isolation, permission checks, audit logging, data privacy, database safety, reliability, scalability, performance, or security, do not implement it casually.

Fix the architecture first.

The system should be simple enough to build, strict enough to protect sensitive HR data, and flexible enough to scale as more companies join the platform.

This `AGENT.md` file must be updated as the project evolves.
