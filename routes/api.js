// routes/api.js - REST API endpoints
const express = require('express');
const router = express.Router();
const store = require('../data/store');

module.exports = function(io) {

// GET all seats
const QRCode = require('qrcode');

  // GET QR code for student check-in page
  router.get('/qrcode', async (req, res) => {
    try {
      const url = `http://${req.headers.host}/student`;
      const qrDataUrl = await QRCode.toDataURL(url);
      res.json({ qrDataUrl, url });
    } catch (err) {
      res.status(500).json({ error: 'Failed to generate QR code' });
    }
  });

  // GET all seats
  router.get('/seats', (req, res) => {
    res.json(store.seats);
  });
router.get('/seats', (req, res) => {
  res.json(store.seats);
});

// GET all students
router.get('/students', (req, res) => {
  res.json(store.students);
});

// GET attendance log
router.get('/attendance', (req, res) => {
  res.json(store.attendanceLog);
});

// GET current session info
router.get('/session', (req, res) => {
  res.json(store.session);
});

// POST: mark a student's attendance (check-in)
router.post('/attendance', (req, res) => {
  const { studentId, seatId } = req.body;

  if (!studentId || !seatId) {
    return res.status(400).json({ error: 'studentId and seatId are required' });
  }

  const student = store.students.find(s => s.id === studentId);
  const seat = store.seats.find(s => s.id === seatId);

  if (!student || !seat) {
    return res.status(404).json({ error: 'Student or seat not found' });
  }

  // Mark seat as occupied
  seat.occupied = true;
  seat.studentId = studentId;

  // Add to attendance log
  const entry = {
    studentId,
    studentName: student.name,
    seatId,
    timestamp: new Date().toISOString()
  };
  store.attendanceLog.push(entry);
  io.emit('attendanceUpdate', entry);
  res.json({ success: true, entry });
});

// POST: start a new session
router.post('/session/start', (req, res) => {
  store.session.active = true;
  store.session.startedAt = new Date().toISOString();
  res.json(store.session);
});

// POST: end the current session
router.post('/session/end', (req, res) => {
  store.session.active = false;
  res.json(store.session);
});

return router;
};