# Project Memory & Technical Knowledge Base

**Project:** Integrated Recruitment, Business & Financial Services Management System  
**Organization:** Benefit Business Solutions Pvt. Ltd.  
**Last Updated:** October 2026

---

## 1. Environment & Network Configuration

- **Host Operating System:** Windows 11
- **Workspace Directory:** `c:\Users\Abhay\OneDrive\Desktop\bpm project`
  - *Note on Directory Path:* The path contains a space (`bpm project`). Any batch or shell scripts must enclose paths in quotes: `"%~dp0backend"`.
- **Backend API Server:** `http://localhost:5000` (Node.js / Express)
- **Frontend Dev Server:** `http://localhost:5173` (Vite / React)
- **Database Engine:** MySQL Server on Port `3306`
  - Schema: `benefit_bbs`
  - User: `root`
  - Password: `ABEE`

---

## 2. Test User Accounts & Credentials

| Role | Name | Email | Password | Assigned Dashboard |
|---|---|---|---|---|
| **Admin** | Sagar Khuspe | `admin@benefit.com` | `admin123` | `/admin/dashboard` |
| **HR (Recruitment)** | Priya Singh | `priya@benefit.com` | `emp123` | `/employee/recruitment-dashboard` |
| **Business / CRM** | Rahul Verma | `rahul@benefit.com` | `emp123` | `/employee/crm-dashboard` |
| **Financial Services**| Neha Gupta | `neha@benefit.com` | `emp123` | `/employee/financial-dashboard` |
| **IT Operations** | Aman Sharma | `it@benefit.com` | `it123` | `/employee/it-dashboard` |

*Password Hashing Details:* All passwords stored in `users.password_hash` are generated with `bcryptjs` salt rounds 10.

---

## 3. Critical Bugs Solved & Lessons Learned

### 3.1 Windows Sandbox Network Isolation
- **Symptom:** Running Node/Vite processes inside the standard restricted sandbox environment makes `localhost:5173` and `localhost:5000` unreachable from the user's host desktop browser (Chrome/Edge), leading to "This site can't be reached" or blank screen.
- **Solution:** Servers must be launched using `start_project.bat` or unsandboxed PowerShell `Start-Process` to bind directly to host network interfaces.

### 3.2 Duplicate Open Sessions & React Duplicate Key Error
- **Symptom:** Admin dashboard displayed duplicate rows for the same employee if the user had logged in multiple times without logging out.
- **Solution:** 
  1. Updated `authcontroller.js` to automatically set `logout_time = NOW()` and `status = 'LoggedOut'` on any previous dangling sessions for that user before inserting a new session.
  2. Updated `getLiveEmployees` SQL in `admincontroller.js` to join only the latest session via `s.id = (SELECT MAX(id) FROM sessions WHERE user_id = u.id AND logout_time IS NULL)`.

### 3.3 Database Column Naming Convention
- **Symptom:** `Unknown column 'due_date' in tasks`.
- **Solution:** The database table `tasks` uses column `due_at` (DATETIME), not `due_date`. All backend queries and controllers have been aligned to `due_at`.

### 3.4 Global `overflow: hidden` Page Scroll Lock
- **Symptom:** Browser window was locked at 100vh and could not scroll/swipe down on dashboard pages.
- **Solution:** `login.css` originally had `html, body { overflow: hidden; }` which bled globally into the Single Page Application. It was adjusted to `overflow-y: auto` on `html, body`, while isolating `overflow: hidden` exclusively to `.login-page-container`.

---

## 4. How to Start the Entire Project

Double click `start_project.bat` located at the project root:
```bat
start_project.bat
```
This automatically launches:
1. Backend Node.js server on `http://localhost:5000` in a dedicated CMD window.
2. Frontend Vite server on `http://localhost:5173` in a dedicated CMD window.

