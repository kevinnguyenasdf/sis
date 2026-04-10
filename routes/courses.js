const express = require('express');
const db = require('../db');
const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized.' });
  next();
}

// List all courses with sections for current semester
router.get('/', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.course_id, c.course_code, c.title, c.description, c.units,
              sec.section_id, sec.room, sec.schedule,
              sec.max_seats, sec.enrolled_count,
              (sec.max_seats - sec.enrolled_count) AS available_seats,
              sem.name AS semester, sem.semester_id,
              p.first_name AS prof_first, p.last_name AS prof_last
       FROM COURSE c
       LEFT JOIN SECTION sec ON c.course_id = sec.course_id
       LEFT JOIN SEMESTER sem ON sec.semester_id = sem.semester_id
       LEFT JOIN PROFESSOR p ON sec.professor_id = p.professor_id
       ORDER BY c.course_code, sem.year DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get prerequisites for a course
router.get('/:id/prerequisites', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.course_id, c.course_code, c.title
       FROM PREREQUISITE p
       JOIN COURSE c ON p.required_course_id = c.course_id
       WHERE p.course_id = ?`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// List all courses (for admin dropdowns)
router.get('/all', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT course_id, course_code, title, units FROM COURSE ORDER BY course_code`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// List all semesters
router.get('/semesters/all', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM SEMESTER ORDER BY year DESC, season`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
