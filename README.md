# Student Information System (SIS)
CPSC 546 – Option 1 Project

## Setup

### 1. Install dependencies
```
npm install
```

### 2. Set up MySQL
Make sure MySQL is running, then create the database and tables:
```
mysql -u root -p < schema.sql
```

### 3. Configure database connection (optional)
Edit `db.js` or set environment variables:
- `DB_HOST` (default: localhost)
- `DB_USER` (default: root)
- `DB_PASSWORD` (default: empty)
- `DB_NAME` (default: sis_db)

### 4. Seed sample data
```
node seed.js
```

### 5. Start the server
```
npm start
```
Then open http://localhost:3000

---

## Sample Accounts (after seeding)

| Role      | Email                        | Password   |
|-----------|------------------------------|------------|
| Admin     | admin@university.edu         | admin123   |
| Professor | ajohnson@university.edu      | prof123    |
| Student   | jane.doe@university.edu      | student123 |

---

## Features by Role

**Student**
- Login and view dashboard
- Browse course catalog with seat availability
- Enroll in courses (prerequisite enforcement)
- Drop courses (deadline enforced)
- View current schedule and academic history

**Professor**
- View assigned sections
- View class roster for each section
- Look up individual student academic history
- Submit grades (auto-updates student grade level)

**Admin**
- Create/remove student and professor accounts
- Add courses, semesters, and sections
- Define course prerequisites
- Generate student transcripts
