# UI/UX Design System Document

**Project:** Integrated Recruitment, Business & Financial Services Management System  
**Organization:** Benefit Business Solutions Pvt. Ltd.  
**Design Philosophy:** Modern Corporate SaaS, High-contrast readability, Calm Professional Dark-Blue palette, Ergonomic Zero-Friction Navigation.

---

## 1. Visual Identity & Brand Styling

### 1.1 Color Palette

| Token Name | Hex Code | Usage Sample |
|---|---|---|
| **Navy Dark (Brand Base)** | `#0a192f` / `#0b1a30` | Top Global Navbar, Left Background Overlay, Sidebar Background |
| **Royal Blue (Primary Accent)** | `#2563eb` | Active Tabs, Primary Action Buttons (`Login →`, `+ Post New Job`), Badges |
| **Hover Blue (Interactive)** | `#1d4ed8` | Button hover states, focused input borders |
| **Emerald Green (Success / Active)**| `#16a34a` / `#dcfce7` | Active Status pill, Completed tasks badge, Working indicator |
| **Amber Orange (Warning / Break)** | `#f59e0b` / `#fef3c7` | Break Status indicator, Medium priority tasks |
| **Coral Red (Alert / Logout)** | `#dc2626` / `#fee2e2` | Overdue tasks, Logged Out status, Logout action button |
| **Slate Gray (Neutral)** | `#f8fafc` / `#e2e8f0` | App background, card borders, secondary text (`#64748b`) |

### 1.2 Typography
- **Primary Body & Headings:** `'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`
  - Font weights: `400` (Regular), `500` (Medium), `600` (Semi-Bold), `700` (Bold).
- **Handwritten Accents (Motto / Taglines):** `'Caveat', cursive`
  - Used on the branding panel for *"Simplify Business. Build Better Relationships."*

---

## 2. Key Screen Layouts

### 2.1 Screen 1: Official BBS Login Screen (100vh Split)
- **Top Global Navbar:** Spans 100% viewport width with BBS logo, full system title, and right-aligned business values (*Smarter Business | Better Connections | Greater Opportunities*).
- **Left Panel (55% width):** High-resolution office workspace background image with deep navy gradient overlay, 4 colored 2x2 feature pills (Recruitment, Business/CRM, Financial Services, Reports & Analytics), handwritten motto, and trust badges.
- **Right Panel (45% width):** Light clean backdrop with a centered elevated card featuring:
  - Role switcher tabs: `[ 👤 Admin Login ]` and `[ 👥 Employee Login ]`
  - Floating label inputs with icons (✉️ Email, 🔒 Password with eye toggle)
  - "Remember me" checkbox + "Forgot password?" link
  - Full-width blue primary action button `Login →`
  - Quick 1-click Demo credentials toolbar for test convenience.

### 2.2 Screen 2: Universal Employee Dashboard Layout
- **Fixed Dark Sidebar (`250px` width):** Brand icon, app title, grouped navigation links (`MY WORK` section and department-specific section).
- **Sticky Top Bar:** Module badge (Blue for Recruitment, Green for Business, Purple for Finance, Indigo for IT), live HH:MM:SS Working Stopwatch, Break status, Take Break / Resume button, and End-of-Day Logout button.
- **Dynamic Content Viewport:** Single-page tabbed switching (`Dashboard`, `My Tasks`, `Jobs`, `Candidates`, `Work Log`) preventing vertical scrolling bloat.

---

## 3. Reusable UI Component Specifications

### 3.1 KPI Metrics Cards
```
+------------------------------------+
| 24                                 |  <- 26px Bold
| Active Job Openings               |  <- 13px Semi-bold
+------------------------------------+
* Card left accent line: 4px solid colored border
```

### 3.2 Status Badges & Pills
- **Working / Active:** `#dcfce7` background with `#15803d` text.
- **On Break / Pending:** `#fef3c7` background with `#b45309` text.
- **Completed / Closed:** `#dbeafe` background with `#1e40af` text.
- **Overdue / Logged Out:** `#fee2e2` background with `#b91c1c` text.

### 3.3 Modal Dialogues
- Darkened backdrop (`rgba(15, 23, 42, 0.6)`) with `backdrop-filter: blur(3px)`.
- Centered container (`max-width: 520px`), rounded corners (`16px`), distinct header with close `✕` button, clean form grid, and right-aligned action buttons (`Cancel` + `Publish`).

