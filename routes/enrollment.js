const express = require('express');
const db = require('../db');
const router = express.Router();

function requireStudent(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'student') {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  next();
}

// Enroll in a section
router.post('/enroll', requireStudent, async (req, res) => {
  const { section_id } = req.body;
  const student_id = req.session.user.id;

  if (!section_id) return res.status(400).json({ error: 'Section ID required.' });

  try {
    const [sections] = await db.query(
      `SELECT sec.*, c.course_id FROM SECTION sec JOIN COURSE c ON sec.course_id = c.course_id WHERE sec.section_id = ?`,
      [section_id]
    );
    if (sections.length === 0) return res.status(404).json({ error: 'Section not found.' });

    const section = sections[0];
    if (section.enrolled_count >= section.max_seats) {
      return res.status(409).json({ error: 'Section is full.' });
    }

    const [existing] = await db.query(
      `SELECT * FROM ENROLLMENT WHERE student_id = ? AND section_id = ? AND status IN ('enrolled', 'completed')`,
      [student_id, section_id]
    );
    if (existing.length > 0) return res.status(409).json({ error: 'Already enrolled or completed this section.' });

    // Check prerequisites
    const [prereqs] = await db.query(
      `SELECT p.required_course_id, c.course_code
       FROM PREREQUISITE p
       JOIN COURSE c ON p.required_course_id = c.course_id
       WHERE p.course_id = ?`,
      [section.course_id]
    );

    for (const prereq of prereqs) {
      const [completed] = await db.query(
        `SELECT e.enrollment_id FROM ENROLLMENT e
         JOIN SECTION sec ON e.section_id = sec.section_id
         WHERE e.student_id = ? AND sec.course_id = ?
           AND e.status = 'completed' AND e.grade NOT IN ('F','W','I')`,
        [student_id, prereq.required_course_id]
      );
      if (completed.length === 0) {
        return res.status(403).json({ error: `Prerequisite not met: ${prereq.course_code}` });
      }
    }

    await db.query(
      `INSERT INTO ENROLLMENT (student_id, section_id, status, enrolled_at) VALUES (?, ?, 'enrolled', CURRENT_DATE)`,
      [student_id, section_id]
    );
    await db.query(
      `UPDATE SECTION SET enrolled_count = enrolled_count + 1 WHERE section_id = ?`,
      [section_id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Drop a course
router.post('/drop', requireStudent, async (req, res) => {
  const { enrollment_id } = req.body;
  const student_id = req.session.user.id;

  if (!enrollment_id) return res.status(400).json({ error: 'Enrollment ID required.' });

  try {
    const [rows] = await db.query(
      `SELECT e.*, sec.semester_id FROM ENROLLMENT e
       JOIN SECTION sec ON e.section_id = sec.section_id
       WHERE e.enrollment_id = ? AND e.student_id = ? AND e.status = 'enrolled'`,
      [enrollment_id, student_id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Enrollment not found.' });

    const enrollment = rows[0];

    const [semRows] = await db.query(
      `SELECT drop_deadline FROM SEMESTER WHERE semester_id = ?`,
      [enrollment.semester_id]
    );
    if (semRows.length > 0 && semRows[0].drop_deadline) {
      const deadline = new Date(semRows[0].drop_deadline);
      if (new Date() > deadline) {
        return res.status(403).json({ error: 'Drop deadline has passed.' });
      }
    }

    await db.query(
      `UPDATE ENROLLMENT SET status = 'dropped' WHERE enrollment_id = ?`,
      [enrollment_id]
    );
    await db.query(
      `UPDATE SECTION SET enrolled_count = enrolled_count - 1 WHERE section_id = ?`,
      [enrollment.section_id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
