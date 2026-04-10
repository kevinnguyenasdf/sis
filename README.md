# Student Information System (SIS)

CPSC 546 – Option 1: Managing a Simulated Group Agile Project

A web-based platform that centralizes course registration, academic record management, and administrative functions for students, professors, and administrative staff at a university.

---

## Features

**Student**
- Login and view dashboard
- Browse course catalog with real-time seat availability
- Enroll in courses (prerequisite enforcement)
- Drop courses (deadline enforced)
- View current schedule and academic history

**Professor**
- View assigned sections and class rosters
- Look up individual student academic history
- Submit grades (automatically updates student grade level)

**Admin**
- Create and remove student and professor accounts
- Add courses, semesters, and sections
- Define course prerequisites and degree requirements
- Generate official student transcripts

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | YugabyteDB (PostgreSQL-compatible) |
| DB Client | node-postgres (`pg`) |
| Auth | express-session + bcryptjs |
| Frontend | HTML, CSS, Vanilla JavaScript |
| Deployment | Vercel (serverless) |

---

## Architecture

The application follows a **monolithic MVC-style architecture** with a REST API backend and a static frontend.

```
Browser
   │
   ▼
Vercel (serverless)
   │
   ▼
Express.js (server.js)
   ├── /api/auth        → Authentication (login, logout, session)
   ├── /api/students    → Student profile, schedule, history
   ├── /api/courses     → Course catalog, prerequisites, semesters
   ├── /api/enrollment  → Enroll and drop courses
   ├── /api/professors  → Rosters, grade submission
   └── /api/admin       → Account management, transcripts
   │
   ▼
YugabyteDB (hosted, PostgreSQL-compatible)
```

**Key design decisions:**
- Sessions are stored server-side via `express-session`
- All database queries go through a single `db.js` wrapper that manages the connection pool and SSL
- Role-based access is enforced at the route level via middleware
- Prerequisite and seat availability checks happen server-side before enrollment is committed

---

## Database Schema

```
MAJOR              (major_id, name, department)
STUDENT            (student_id, first_name, last_name, email, password_hash, grade_level, total_units, major_id)
PROFESSOR          (professor_id, first_name, last_name, email, password_hash)
ADMIN              (admin_id, first_name, last_name, email, password_hash)
COURSE             (course_id, course_code, title, description, units, department_id)
PREREQUISITE       (prereq_id, course_id, required_course_id)
SEMESTER           (semester_id, name, season, year, drop_deadline, start_date, end_date)
SECTION            (section_id, course_id, professor_id, semester_id, room, schedule, max_seats, enrolled_count)
ENROLLMENT         (enrollment_id, student_id, section_id, status, grade, enrolled_at)
DEGREE_REQUIREMENT (req_id, major_id, course_id)
TRANSCRIPT         (transcript_id, student_id, admin_id, generated_at)
```

---

## Setup

### Prerequisites
- Node.js
- A YugabyteDB or PostgreSQL database
- YugabyteDB CA certificate (`root.crt`) if using YugabyteDB AEON

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file (never commit this):
```
DATABASE_URL=postgresql://user:password@host:5433/dbname?ssl=true&sslmode=verify-full
YUGABYTE_CA_CERT=<contents of root.crt>
SESSION_SECRET=your-secret-key
```

### 3. Initialize the database
```bash
psql "$DATABASE_URL&sslrootcert=/path/to/root.crt" -f schema.sql
```

### 4. Start the server
```bash
npm start
```

The app will be available at `http://localhost:3000`.

---

## Deployment (Vercel)

1. Push the repo to GitHub
2. Import the project at [vercel.com](https://vercel.com)
3. Set the following environment variables in the Vercel dashboard:
   - `DATABASE_URL`
   - `YUGABYTE_CA_CERT` — full contents of `root.crt`
   - `SESSION_SECRET`
4. Deploy — Vercel auto-deploys on every push to `main`

---

## Course

CPSC 546 — Option 1: Managing a Simulated Group Agile Project
