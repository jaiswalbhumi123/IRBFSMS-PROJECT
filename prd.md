# Product Requirements Document (PRD)

**Project Name:** Integrated Recruitment, Business & Financial Services Management System  
**Organization:** Benefit Business Solutions Pvt. Ltd.  
**Project Type:** Comprehensive Enterprise ERP & Employee Workflow Management System  
**Version:** 1.0.0  
**Target Audience:** Corporate Administrators, HR Recruiters, CRM/Business Executives, Financial Consultants, and IT Operations Engineers.

---

## 1. Executive Summary
Benefit Business Solutions Pvt. Ltd. requires an all-in-one web-based ERP and workflow management platform that consolidates four primary operational pillars into a single secure application:
1. **Recruitment Management** (Talent Acquisition, Job Vacancies, Candidates, Interviews)
2. **Business / CRM Management** (Clients, Leads, Follow-ups, Quotations)
3. **Financial Services Management** (Loan Applications, Credit Cards, Partner Bank Coordination)
4. **IT Operations Management** (System Health Monitoring, Internal Support Tickets, Employee IT Infrastructure)
5. **Real-time Employee Monitoring & Time Tracking** (Live Activity Stopwatch, Break Tracker, Mandatory End-of-Day Daily Reports)

---

## 2. Core Problem Statement
- **Fragmented Tools:** Teams previously tracked work on separate spreadsheets, resulting in lost client leads, uncoordinated candidate interviews, and delayed loan application statuses.
- **Lack of Real-time Accountability:** Management had no automated way to view which employee is working, on break, or idle without constant manual check-ins.
- **Disconnected End-of-Day Reporting:** Daily activity logs were submitted irregularly, making task handoffs and workload balancing difficult.

---

## 3. User Roles & Personas

| Role | Default User | Department / Module | Primary Responsibilities |
|---|---|---|---|
| **System Administrator** | `admin@benefit.com` | Corporate Management | View live employee monitor, assign tasks with priority and deadlines, oversee all business verticals, view audit reports. |
| **Recruitment Specialist (HR)** | `priya@benefit.com` | Recruitment | Post and manage job openings, screen candidates, coordinate interview schedules, manage candidate placements. |
| **Business / CRM Executive** | `rahul@benefit.com` | Business / CRM | Track corporate clients, log sales leads, follow up on proposals, convert prospects. |
| **Financial Services Specialist** | `neha@benefit.com` | Financial Services | Process personal/business loan applications, track partner bank approvals, guide credit card requests. |
| **IT Operations Engineer** | `it@benefit.com` | IT Operations | Monitor server infrastructure, database availability, resolve technical tickets, ensure zero downtime. |

---

## 4. Key Functional Requirements

### 4.1 Authentication & Direct Role-Based Routing
- Single unified login screen matching official Benefit Business Solutions branding.
- Support for instant role toggle: `[ Admin Login ]` and `[ Employee Login ]`.
- **Smart Direct Routing:**
  - Logging in as `admin@benefit.com` opens `/admin/dashboard` (Live Monitor).
  - Logging in as `it@benefit.com` opens `/employee/it-dashboard` directly.
  - Logging in as `priya@benefit.com` opens `/employee/recruitment-dashboard` directly.
  - Logging in as `rahul@benefit.com` opens `/employee/crm-dashboard` directly.
  - Logging in as `neha@benefit.com` opens `/employee/financial-dashboard` directly.
- Multi-card module selection screen is preserved as a fallback only for unassigned staff.

### 4.2 Time Tracking, Breaks & Daily Reports
- **Live Stopwatch:** Tracks total working seconds from the moment of login.
- **Break Management:** Dedicated `Start Break` and `End Break` buttons with real-time break counters.
- **Mandatory Daily Report on Logout:** Clicking `Logout` prevents instant session termination; instead, a mandatory popup forces the employee to submit:
  - Work Summary
  - Tasks Completed Today
  - Blockers / Challenges Faced
  - Automatically calculates total working hours.

### 4.3 Recruitment Module
- **Job Openings Directory:** View all active jobs with title, department, location, openings count, experience, and salary range.
- **Post New Job Modal:** HR can publish new vacancies which save directly to the MySQL database.
- **Candidate Pipeline:** Track applicants through stages (Applied, Screening, Interview, Selected).

### 4.4 Admin Live Monitor & Task Assignment
- Real-time status cards: Working Now, On Break, Logged Out, Total Active Staff.
- Auto-refreshing employee monitor grid showing current task, status pill, and login time.
- Task Assignment form with deadline (`due_at`), priority levels (Low, Medium, High, Urgent), and employee workload guidance.

---

## 5. Non-Functional Requirements
- **Security:** Passwords encrypted using bcrypt (salt rounds: 10), state-of-the-art JWT authentication tokens with 1-day expiry.
- **Performance:** Sub-second response times for dashboard APIs; single-page application navigation with Vite.
- **Responsive & Ergonomic:** 100vh lock on authentication screen; smooth scrolling tab views for employee operations.

