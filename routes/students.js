const express = require('express');
const db = require('../db');
const router = express.Router();

function requireStudent(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'student') {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  next();
}

// Get current student profile
router.get('/me', requireStudent, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.student_id, s.first_name, s.last_name, s.email, s.grade_level, s.total_units, m.name AS major
       FROM STUDENT s LEFT JOIN MAJOR m ON s.major_id = m.major_id
       WHERE s.student_id = ?`,
      [req.session.user.id]
    );
    res.json(rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get current schedule (active enrollments)
router.get('/schedule', requireStudent, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT e.enrollment_id, c.course_code, c.title, c.units,
              sec.room, sec.schedule, sem.name AS semester,
              e.status, e.grade, p.first_name AS prof_first, p.last_name AS prof_last
       FROM ENROLLMENT e
       JOIN SECTION sec ON e.section_id = sec.section_id
       JOIN COURSE c ON sec.course_id = c.course_id
       JOIN SEMESTER sem ON sec.semester_id = sem.semester_id
       JOIN PROFESSOR p ON sec.professor_id = p.professor_id
       WHERE e.student_id = ? AND e.status = 'enrolled'`,
      [req.session.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get academic history (all completed/graded enrollments)
router.get('/history', requireStudent, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.course_code, c.title, c.units, sem.name AS semester,
              sem.year, e.grade, e.status
       FROM ENROLLMENT e
       JOIN SECTION sec ON e.section_id = sec.section_id
       JOIN COURSE c ON sec.course_id = c.course_id
       JOIN SEMESTER sem ON sec.semester_id = sem.semester_id
       WHERE e.student_id = ?
       ORDER BY sem.year DESC, sem.season`,
      [req.session.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
