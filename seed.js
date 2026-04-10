// Run: node seed.js
const bcrypt = require('bcryptjs');
const db = require('./db');

async function seed() {
  console.log('Seeding database...');

  const adminHash = bcrypt.hashSync('admin123', 10);
  const profHash = bcrypt.hashSync('prof123', 10);
  const stuHash = bcrypt.hashSync('student123', 10);

  await db.query(`INSERT OR IGNORE INTO MAJOR (name, department) VALUES ('Computer Science', 'Engineering')`);
  await db.query(`INSERT OR IGNORE INTO MAJOR (name, department) VALUES ('Mathematics', 'Sciences')`);
  await db.query(`INSERT OR IGNORE INTO MAJOR (name, department) VALUES ('Business Administration', 'Business')`);

  await db.query(`INSERT OR IGNORE INTO ADMIN (first_name, last_name, email, password_hash) VALUES ('Admin', 'User', 'admin@university.edu', ?)`, [adminHash]);
  await db.query(`INSERT OR IGNORE INTO PROFESSOR (first_name, last_name, email, password_hash) VALUES ('Alice', 'Johnson', 'ajohnson@university.edu', ?)`, [profHash]);
  await db.query(`INSERT OR IGNORE INTO PROFESSOR (first_name, last_name, email, password_hash) VALUES ('Bob', 'Smith', 'bsmith@university.edu', ?)`, [profHash]);
  await db.query(`INSERT OR IGNORE INTO STUDENT (first_name, last_name, email, password_hash, major_id) VALUES ('Jane', 'Doe', 'jane.doe@university.edu', ?, 1)`, [stuHash]);
  await db.query(`INSERT OR IGNORE INTO STUDENT (first_name, last_name, email, password_hash, major_id) VALUES ('John', 'Smith', 'john.smith@university.edu', ?, 1)`, [stuHash]);

  await db.query(`INSERT OR IGNORE INTO COURSE (course_code, title, description, units) VALUES ('CPSC 101', 'Intro to Programming', 'Fundamentals of programming using Python.', 3)`);
  await db.query(`INSERT OR IGNORE INTO COURSE (course_code, title, description, units) VALUES ('CPSC 201', 'Data Structures', 'Arrays, linked lists, trees, and graphs.', 3)`);
  await db.query(`INSERT OR IGNORE INTO COURSE (course_code, title, description, units) VALUES ('CPSC 301', 'Algorithms', 'Algorithm design and complexity analysis.', 3)`);
  await db.query(`INSERT OR IGNORE INTO COURSE (course_code, title, description, units) VALUES ('CPSC 546', 'Software Project Management', 'Agile methods and project planning.', 3)`);
  await db.query(`INSERT OR IGNORE INTO COURSE (course_code, title, description, units) VALUES ('MATH 101', 'Calculus I', 'Limits, derivatives, and integrals.', 4)`);

  await db.query(`INSERT OR IGNORE INTO PREREQUISITE (course_id, required_course_id)
    SELECT c1.course_id, c2.course_id FROM COURSE c1, COURSE c2
    WHERE c1.course_code = 'CPSC 201' AND c2.course_code = 'CPSC 101'`);
  await db.query(`INSERT OR IGNORE INTO PREREQUISITE (course_id, required_course_id)
    SELECT c1.course_id, c2.course_id FROM COURSE c1, COURSE c2
    WHERE c1.course_code = 'CPSC 301' AND c2.course_code = 'CPSC 201'`);

  await db.query(`INSERT OR IGNORE INTO SEMESTER (name, season, year, drop_deadline, start_date, end_date)
    VALUES ('Spring 2025', 'Spring', 2025, '2025-01-20', '2025-01-13', '2025-05-10')`);
  await db.query(`INSERT OR IGNORE INTO SEMESTER (name, season, year, drop_deadline, start_date, end_date)
    VALUES ('Fall 2025', 'Fall', 2025, '2025-12-31', '2025-08-25', '2025-12-15')`);

  const [profs] = await db.query(`SELECT professor_id FROM PROFESSOR ORDER BY professor_id`);
  const [sems] = await db.query(`SELECT semester_id FROM SEMESTER ORDER BY semester_id LIMIT 1`);
  const [courses] = await db.query(`SELECT course_id FROM COURSE ORDER BY course_id`);

  const sem = sems[0];
  const schedules = ['MWF 9:00-9:50am','TR 10:30-11:45am','MWF 1:00-1:50pm','TR 2:00-3:15pm','MWF 11:00-11:50am'];
  const rooms = ['Room 101','Room 202','Room 303','Room 104','Room 205'];

  for (let i = 0; i < courses.length; i++) {
    const prof = profs[i % profs.length];
    await db.query(
      `INSERT OR IGNORE INTO SECTION (course_id, professor_id, semester_id, room, schedule, max_seats) VALUES (?, ?, ?, ?, ?, 30)`,
      [courses[i].course_id, prof.professor_id, sem.semester_id, rooms[i], schedules[i]]
    );
  }

  console.log('\nDone! Sample accounts:');
  console.log('  Admin:     admin@university.edu    / admin123');
  console.log('  Professor: ajohnson@university.edu / prof123');
  console.log('  Student:   jane.doe@university.edu / student123');
}

seed().catch(err => { console.error(err); process.exit(1); });
