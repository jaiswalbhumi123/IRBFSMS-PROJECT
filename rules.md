# Engineering Rules & Coding Standards

**Project:** Integrated Recruitment, Business & Financial Services Management System  
**Organization:** Benefit Business Solutions Pvt. Ltd.  
**Standard:** Enterprise Clean Architecture & Secure REST API Design

---

## 1. Backend Standards (Node.js & Express)

### 1.1 Architecture & Separation of Concerns
- **Routes (`src/routes/`):** Must strictly define HTTP method bindings and middleware guards. No database queries or business logic inside route files.
- **Controllers (`src/controllers/`):** Handle request body parsing, validation, database query execution, and response serialization.
- **Config (`src/config/`):** Database connection pooling and external service configurations.

### 1.2 Security & Data Integrity
1. **Never Save Plaintext Passwords:** All user passwords must be hashed using `bcrypt` (minimum 10 salt rounds) before inserting into `users`.
2. **Prevent SQL Injection:** Never concatenate strings in SQL queries (e.g. `SELECT * FROM users WHERE email = '` + email + `'`). Always use parameterized queries: `pool.query('SELECT * FROM users WHERE email = ?', [email])`.
3. **Route Protection:** All endpoints except `/api/auth/login` must include the `protect` middleware verifying the Bearer JWT token.
4. **Role Authorization:** Admin-only routes must include both `protect` and `adminOnly` middleware.

### 1.3 Error Handling & Status Codes
- Return HTTP `200` for successful GET/PUT.
- Return HTTP `201` for successful POST resource creation.
- Return HTTP `400` for client validation errors (missing required fields).
- Return HTTP `401` for unauthenticated requests.
- Return HTTP `403` for forbidden role permissions.
- Return HTTP `500` for unhandled database/server exceptions, wrapped in `try/catch` with a clear error response.

---

## 2. Frontend Standards (React & Vite)

### 2.1 Component Structure
- Components must be functional and use modern React Hooks (`useState`, `useEffect`, `useCallback`).
- Reusable UI elements (Headers, Modals, Timers) must reside in `src/components/`.
- Full-page views must reside in `src/pages/` organized by access domain (`admin/`, `employee/`, `auth/`).

### 2.2 API Communication
- All HTTP calls must use the centralized `src/services/api.js` instance.
- Direct `fetch()` or bare `axios` calls in components are prohibited; use `api.get()` / `api.post()`.
- Global Axios interceptors automatically inject `Authorization: Bearer <token>` and `x-session-id`.

### 2.3 CSS & Ergonomics
- Never place `overflow: hidden` on global `html` or `body` selectors, as this breaks scrolling on content-heavy pages.
- Use explicit viewport scoping for full-screen pages: `.login-page-container { height: 100vh; overflow: hidden; }`.
- Maintain consistent button styling: Primary action `#2563eb`, Success `#16a34a`, Warning `#f59e0b`, Danger `#dc2626`.

---

## 3. Database Modification Standards

- Any new table creation must include:
  - `id INT AUTO_INCREMENT PRIMARY KEY`
  - `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
  - Appropriate foreign keys with cascading/nullifying rules (`ON DELETE SET NULL` or `CASCADE`).
- Enums must match predefined module names: `'IT', 'Recruitment', 'Business', 'Financial'`.

