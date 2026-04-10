const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const router = express.Router();

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  next();
}

// Create student account
router.post('/students', requireAdmin, async (req, res) => {
  const { first_name, last_name, email, password, major_id } = req.body;
  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    await db.query(
      `INSERT INTO STUDENT (first_name, last_name, email, password_hash, major_id) VALUES (?, ?, ?, ?, ?)`,
      [first_name, last_name, email, hash, major_id || null]
    );
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already exists.' });
    res.status(500).json({ error: 'Server error.' });
  }
});

// Update student account
router.put('/students/:id', requireAdmin, async (req, res) => {
  const { first_name, last_name, email, major_id, grade_level } = req.body;
  try {
    await db.query(
      `UPDATE STUDENT SET first_name = ?, last_name = ?, email = ?, major_id = ?, grade_level = ? WHERE student_id = ?`,
      [first_name, last_name, email, major_id || null, grade_level, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already exists.' });
    res.status(500).json({ error: 'Server error.' });
  }
});

// Delete student account
router.delete('/students/:id', requireAdmin, async (req, res) => {
  try {
    await db.query(`DELETE FROM STUDENT WHERE student_id = ?`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// List all students
router.get('/students', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.student_id, s.first_name, s.last_name, s.email,
              s.grade_level, s.total_units, m.name AS major
       FROM STUDENT s LEFT JOIN MAJOR m ON s.major_id = m.major_id`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Create professor account
router.post('/professors', requireAdmin, async (req, res) => {
  const { first_name, last_name, email, password } = req.body;
  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    await db.query(
      `INSERT INTO PROFESSOR (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)`,
      [first_name, last_name, email, hash]
    );
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already exists.' });
    res.status(500).json({ error: 'Server error.' });
  }
});

// Update professor account
router.put('/professors/:id', requireAdmin, async (req, res) => {
  const { first_name, last_name, email } = req.body;
  try {
    await db.query(
      `UPDATE PROFESSOR SET first_name = ?, last_name = ?, email = ? WHERE professor_id = ?`,
      [first_name, last_name, email, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already exists.' });
    res.status(500).json({ error: 'Server error.' });
  }
});

// Delete professor account
router.delete('/professors/:id', requireAdmin, async (req, res) => {
  try {
    await db.query(`DELETE FROM PROFESSOR WHERE professor_id = ?`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// List all professors
router.get('/professors', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT professor_id, first_name, last_name, email FROM PROFESSOR`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Create course
router.post('/courses', requireAdmin, async (req, res) => {
  const { course_code, title, description, units } = req.body;
  if (!course_code || !title) return res.status(400).json({ error: 'Course code and title required.' });
  try {
    await db.query(
      `INSERT INTO COURSE (course_code, title, description, units) VALUES (?, ?, ?, ?)`,
      [course_code, title, description || null, units || 3]
    );
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Course code already exists.' });
    res.status(500).json({ error: 'Server error.' });
  }
});

// Update course
router.put('/courses/:id', requireAdmin, async (req, res) => {
  const { course_code, title, units, description } = req.body;
  try {
    await db.query(
      `UPDATE COURSE SET course_code = ?, title = ?, units = ?, description = ? WHERE course_id = ?`,
      [course_code, title, units, description || null, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Course code already exists.' });
    res.status(500).json({ error: 'Server error.' });
  }
});

// Define prerequisite
router.post('/prerequisites', requireAdmin, async (req, res) => {
  const { course_id, required_course_id } = req.body;
  if (!course_id || !required_course_id) return res.status(400).json({ error: 'Both course IDs required.' });
  try {
    await db.query(
      `INSERT INTO PREREQUISITE (course_id, required_course_id) VALUES (?, ?)`,
      [course_id, required_course_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Create semester
router.post('/semesters', requireAdmin, async (req, res) => {
  const { name, season, year, drop_deadline, start_date, end_date } = req.body;
  if (!name || !season || !year) return res.status(400).json({ error: 'Name, season, year required.' });
  try {
    await db.query(
      `INSERT INTO SEMESTER (name, season, year, drop_deadline, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, season, year, drop_deadline || null, start_date || null, end_date || null]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Create section
router.post('/sections', requireAdmin, async (req, res) => {
  const { course_id, professor_id, semester_id, room, schedule, max_seats } = req.body;
  if (!course_id || !professor_id || !semester_id) {
    return res.status(400).json({ error: 'Course, professor, and semester required.' });
  }
  try {
    await db.query(
      `INSERT INTO SECTION (course_id, professor_id, semester_id, room, schedule, max_seats)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [course_id, professor_id, semester_id, room || null, schedule || null, max_seats || 30]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Generate transcript
router.post('/transcripts', requireAdmin, async (req, res) => {
  const { student_id } = req.body;
  if (!student_id) return res.status(400).json({ error: 'Student ID required.' });
  try {
    await db.query(
      `INSERT INTO TRANSCRIPT (student_id, admin_id) VALUES (?, ?)`,
      [student_id, req.session.user.id]
    );
    const [rows] = await db.query(
      `SELECT s.first_name, s.last_name, s.email, s.grade_level, s.total_units,
              m.name AS major,
              c.course_code, c.title, c.units, sem.name AS semester, sem.year, e.grade
       FROM STUDENT s
       LEFT JOIN MAJOR m ON s.major_id = m.major_id
       LEFT JOIN ENROLLMENT e ON e.student_id = s.student_id
       LEFT JOIN SECTION sec ON e.section_id = sec.section_id
       LEFT JOIN COURSE c ON sec.course_id = c.course_id
       LEFT JOIN SEMESTER sem ON sec.semester_id = sem.semester_id
       WHERE s.student_id = ?
       ORDER BY sem.year, sem.season`,
      [student_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get enrollments for a student
router.get('/students/:id/enrollments', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT e.enrollment_id, e.status, e.grade, c.course_code, c.title, sem.name AS semester
       FROM ENROLLMENT e
       JOIN SECTION sec ON e.section_id = sec.section_id
       JOIN COURSE c ON sec.course_id = c.course_id
       JOIN SEMESTER sem ON sec.semester_id = sem.semester_id
       WHERE e.student_id = ? AND e.status = 'enrolled'
       ORDER BY sem.year DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Force drop a student from a section
router.delete('/enrollments/:enrollmentId', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT section_id FROM ENROLLMENT WHERE enrollment_id = ? AND status = 'enrolled'`,
      [req.params.enrollmentId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Active enrollment not found.' });

    await db.query(`UPDATE ENROLLMENT SET status = 'dropped' WHERE enrollment_id = ?`, [req.params.enrollmentId]);
    await db.query(`UPDATE SECTION SET enrolled_count = enrolled_count - 1 WHERE section_id = ?`, [rows[0].section_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get all majors
router.get('/majors', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM MAJOR`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Create major
router.post('/majors', requireAdmin, async (req, res) => {
  const { name, department } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required.' });
  try {
    await db.query(`INSERT INTO MAJOR (name, department) VALUES (?, ?)`, [name, department || null]);
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Major already exists.' });
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
