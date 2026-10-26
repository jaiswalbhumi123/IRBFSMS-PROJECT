# System Architecture Document

**Project:** Integrated Recruitment, Business & Financial Services Management System  
**Organization:** Benefit Business Solutions Pvt. Ltd.  
**Architecture Style:** 3-Tier Client-Server Architecture (RESTful API + Single Page Application)

---

## 1. High-Level Architecture Diagram

```mermaid
flowchart TD
    subgraph ClientLayer["Frontend Presentation Tier (Client)"]
        Browser["Desktop & Mobile Browsers"]
        SPA["React 18 + Vite SPA"]
        Router["React Router v6 (Protected Routing)"]
        State["React Component State & Axios Interceptors"]
    end

    subgraph APILayer["Application Logic Tier (Node.js / Express Server)"]
        Server["Express.js Server (Port 5000)"]
        CORS["CORS & JSON Body Parser Middleware"]
        AuthMiddleware["JWT Authentication & Role Guard"]
        
        subgraph Controllers["API Controllers"]
            AuthController["authcontroller.js"]
            AdminController["admincontroller.js"]
            EmpController["employeecontroller.js"]
            TaskController["taskcontroller.js"]
            JobController["jobcontroller.js"]
        end
    end

    subgraph DataLayer["Data Persistence Tier (Relational DB)"]
        MySQL[("MySQL Database: benefit_bbs (Port 3306)")]
        ConnectionPool["mysql2/promise Connection Pool (10 max connections)"]
    end

    Browser --> SPA
    SPA --> Router
    Router --> State
    State -->|HTTP/REST with JWT Bearer Token| Server

    Server --> CORS
    CORS --> AuthMiddleware
    AuthMiddleware --> Controllers

    Controllers --> ConnectionPool
    ConnectionPool --> MySQL
```

---

## 2. Technology Stack

### 2.1 Frontend Tier
- **Framework:** React 18.x with Vite bundler
- **Routing:** `react-router-dom` v6
- **HTTP Client:** `axios` with global interceptors attaching `Authorization: Bearer <token>` and `x-session-id`
- **UI Styling:** Custom CSS, Google Fonts (`Plus Jakarta Sans`, `Caveat`), Bootstrap 5 utility grid
- **State Management:** React Native Hooks (`useState`, `useEffect`, `useCallback`)

### 2.2 Backend Tier
- **Runtime:** Node.js (v18+)
- **Web Framework:** Express.js 4.x
- **Authentication:** `jsonwebtoken` (JWT), `bcryptjs` for salted password hashing
- **Environment Management:** `dotenv`

### 2.3 Database Tier
- **Database Engine:** MySQL 8.0+
- **Driver:** `mysql2/promise` with connection pooling
- **Schema Name:** `benefit_bbs`

---

## 3. Database Entity Relationship (ER) Schema

```mermaid
erDiagram
    users ||--o{ sessions : "logs in"
    users ||--o{ tasks : "assigned"
    users ||--o{ task_updates : "performs"
    users ||--o{ daily_reports : "submits"
    users ||--o{ jobs : "posts"
    sessions ||--o{ breaks : "contains"
    sessions ||--o{ daily_reports : "associated with"
    tasks ||--o{ task_updates : "tracks"

    users {
        int id PK
        varchar name
        varchar email UK
        varchar password_hash
        enum role "Admin, Employee"
        enum module "Recruitment, Business, Financial, IT"
        enum status "Active, Inactive"
        timestamp created_at
    }

    sessions {
        int id PK
        int user_id FK
        enum module "Recruitment, Business, Financial, IT"
        datetime login_time
        datetime logout_time
        int break_minutes
        int total_minutes
        enum status "Working, Break, LoggedOut"
    }

    breaks {
        int id PK
        int session_id FK
        datetime start_time
        datetime end_time
        int duration_minutes
    }

    tasks {
        int id PK
        varchar title
        text description
        enum module "Recruitment, Business, Financial, IT"
        int assigned_to FK
        int assigned_by FK
        enum priority "Low, Medium, High, Urgent"
        enum status "Assigned, In Progress, Completed"
        datetime due_at
        datetime completed_at
        timestamp created_at
    }

    task_updates {
        int id PK
        int task_id FK
        int user_id FK
        varchar old_status
        varchar new_status
        text note
        timestamp created_at
    }

    daily_reports {
        int id PK
        int user_id FK
        int session_id FK
        date report_date
        text summary
        text tasks_completed
        text blockers
        int total_hours
        timestamp created_at
    }

    jobs {
        int id PK
        varchar title
        enum department "IT, Recruitment, Business, Financial"
        varchar location
        int openings
        varchar experience_required
        varchar salary_range
        enum status "Active, Closed"
        int created_by FK
        timestamp created_at
    }
```

---

## 4. API Endpoints Map

| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticates credentials, creates active session, issues JWT |
| `POST` | `/api/auth/logout` | Protected | Closes active session, timestamps logout |
| `GET` | `/api/admin/live-employees` | Protected (Admin) | Real-time live status and current task of all employees |
| `GET` | `/api/admin/stats` | Protected (Admin) | Summary counters: Working, On Break, Logged Out, Total |
| `POST` | `/api/tasks` | Protected (Admin) | Creates new task and assigns to specific employee |
| `GET` | `/api/employee/dashboard-data`| Protected (Employee) | Session timer, today's tasks, live metrics, activity timeline |
| `POST` | `/api/employee/break/start` | Protected (Employee) | Starts break, toggles session status to 'Break' |
| `POST` | `/api/employee/break/end` | Protected (Employee) | Resumes session to 'Working', records duration |
| `PUT` | `/api/employee/tasks/:id/status`| Protected (Employee) | Updates status (In Progress, Completed) |
| `POST` | `/api/employee/daily-report` | Protected (Employee) | Submits end-of-day report and logs out |
| `GET` | `/api/employee/work-log` | Protected (Employee) | Historical sessions, working hours, and completed tasks |
| `GET` | `/api/jobs` | Protected | Fetches all open job vacancies with creator details |
| `POST` | `/api/jobs` | Protected | Publishes a new job vacancy |

