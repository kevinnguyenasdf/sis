const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role are required.' });
  }

  try {
    let table, idField;
    if (role === 'student') { table = 'STUDENT'; idField = 'student_id'; }
    else if (role === 'professor') { table = 'PROFESSOR'; idField = 'professor_id'; }
    else if (role === 'admin') { table = 'ADMIN'; idField = 'admin_id'; }
    else return res.status(400).json({ error: 'Invalid role.' });

    const [rows] = await db.query(`SELECT * FROM ${table} WHERE email = ?`, [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials.' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials.' });

    req.session.user = {
      id: user[idField],
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role,
    };

    res.json({ success: true, role, redirect: `/${role}/dashboard.html` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

router.get('/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not authenticated.' });
  res.json(req.session.user);
});

module.exports = router;
