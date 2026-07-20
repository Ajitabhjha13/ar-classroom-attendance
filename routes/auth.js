const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { loadData, saveData } = require('../data/store');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const db = loadData();
  const user = db.users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });
  req.session.user = { id: user.id, name: user.name, role: user.role, email: user.email, rollNo: user.rollNo };
  res.json({ success: true, user: req.session.user });
});

router.post('/signup', async (req, res) => {
  const { name, email, password, role, rollNo } = req.body;
  const db = loadData();
  if (db.users.find(u => u.email === email)) return res.status(400).json({ error: 'Email already exists' });
  const hash = await bcrypt.hash(password, 10);
  const user = { id: `u${Date.now()}`, name, email, password: hash, role: role || 'student', rollNo };
  db.users.push(user);
  saveData(db);
  req.session.user = { id: user.id, name, role: user.role, email, rollNo };
  res.json({ success: true, user: req.session.user });
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

router.get('/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  res.json(req.session.user);
});

module.exports = router;
