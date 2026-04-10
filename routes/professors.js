const express = require('express');
const db = require('../db');
const router = express.Router();

function requireProfessor(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'professor') {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  next();
}

router.get('/sections', requireProfessor, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT sec.section_id, c.course_code, c.title, sem.name AS semester,
              sec.room, sec.schedule, sec.enrolled_count, sec.max_seats
       FROM SECTION sec
       JOIN COURSE c ON sec.course_id = c.course_id
       JOIN SEMESTER sem ON sec.semester_id = sem.semester_id
       WHERE sec.professor_id = ?`,
      [req.session.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.get('/sections/:id/roster', requireProfessor, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.student_id, s.first_name, s.last_name, s.email,
              s.grade_level, e.enrollment_id, e.grade, e.status
       FROM ENROLLMENT e
       JOIN STUDENT s ON e.student_id = s.student_id
       WHERE e.section_id = ? AND e.status = 'enrolled'`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.get('/student/:id/history', requireProfessor, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.course_code, c.title, c.units, sem.name AS semester,
              sem.year, e.grade, e.status
       FROM ENROLLMENT e
       JOIN SECTION sec ON e.section_id = sec.section_id
       JOIN COURSE c ON sec.course_id = c.course_id
       JOIN SEMESTER sem ON sec.semester_id = sem.semester_id
       WHERE e.student_id = ?
       ORDER BY sem.year DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Submit grade
router.put('/grades/:enrollmentId', requireProfessor, async (req, res) => {
  const { grade } = req.body;
  const validGrades = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F', 'W', 'I'];
  if (!validGrades.includes(grade)) {
    return res.status(400).json({ error: 'Invalid grade.' });
  }
  try {
    // Get the student_id first
    const [enrollRows] = await db.query(
      `SELECT student_id FROM ENROLLMENT WHERE enrollment_id = ?`,
      [req.params.enrollmentId]
    );
    if (enrollRows.length === 0) return res.status(404).json({ error: 'Enrollment not found.' });
    const student_id = enrollRows[0].student_id;

    await db.query(
      `UPDATE ENROLLMENT SET grade = ?, status = 'completed' WHERE enrollment_id = ?`,
      [grade, req.params.enrollmentId]
    );

    // Auto-update grade level
    const [unitRows] = await db.query(
      `SELECT SUM(c.units) AS total_units
       FROM ENROLLMENT e
       JOIN SECTION sec ON e.section_id = sec.section_id
       JOIN COURSE c ON sec.course_id = c.course_id
       WHERE e.student_id = ? AND e.status = 'completed' AND e.grade NOT IN ('F','W','I')`,
      [student_id]
    );

    const units = unitRows[0]?.total_units || 0;
    let gradeLevel = 'Freshman';
    if (units >= 90) gradeLevel = 'Senior';
    else if (units >= 60) gradeLevel = 'Junior';
    else if (units >= 30) gradeLevel = 'Sophomore';

    await db.query(
      `UPDATE STUDENT SET total_units = ?, grade_level = ? WHERE student_id = ?`,
      [units, gradeLevel, student_id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
