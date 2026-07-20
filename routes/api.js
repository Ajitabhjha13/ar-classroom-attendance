const express = require('express');
const QRCode = require('qrcode');
const router = express.Router();
const { loadData, saveData, seedSeats } = require('../data/store');

const requireAuth = (req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: 'Login required' });
  next();
};
const requireFaculty = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'faculty')
    return res.status(403).json({ error: 'Faculty only' });
  next();
};

// ROOMS
router.get('/rooms', requireAuth, (req, res) => {
  const db = loadData();
  res.json(db.rooms);
});

router.post('/rooms', requireFaculty, (req, res) => {
  const db = loadData();
  const room = { id: `room${Date.now()}`, ...req.body, active: true };
  db.rooms.push(room);
  saveData(db);
  res.json(room);
});

// SEATS
router.get('/rooms/:roomId/seats', requireAuth, (req, res) => {
  seedSeats(req.params.roomId);
  const db = loadData();
  res.json(db.seats.filter(s => s.roomId === req.params.roomId));
});

router.post('/rooms/:roomId/seats/:seatId/claim', requireAuth, (req, res) => {
  const db = loadData();
  const seat = db.seats.find(s => s.id === req.params.seatId);
  if (!seat) return res.status(404).json({ error: 'Seat not found' });
  if (seat.status === 'occupied') return res.status(400).json({ error: 'Seat already taken' });
  seat.status = 'occupied';
  seat.student = req.session.user.name;
  seat.studentId = req.session.user.id;
  seat.checkedInAt = new Date().toISOString();
  seat.method = req.body.method || 'Manual';
  saveData(db);

  // Log attendance
  db.attendance.push({
    id: `att${Date.now()}`,
    studentId: req.session.user.id,
    studentName: req.session.user.name,
    rollNo: req.session.user.rollNo,
    roomId: req.params.roomId,
    seatId: seat.id,
    seatLabel: seat.label,
    timestamp: new Date().toISOString(),
    method: seat.method,
    status: 'present'
  });
  saveData(db);
  res.json({ success: true, seat });
});

router.post('/rooms/:roomId/seats/:seatId/release', requireFaculty, (req, res) => {
  const db = loadData();
  const seat = db.seats.find(s => s.id === req.params.seatId);
  if (!seat) return res.status(404).json({ error: 'Not found' });
  seat.status = 'available';
  seat.student = null; seat.studentId = null;
  seat.checkedInAt = null; seat.method = null;
  saveData(db);
  res.json({ success: true });
});

// ATTENDANCE
router.get('/rooms/:roomId/attendance', requireAuth, (req, res) => {
  const db = loadData();
  res.json(db.attendance.filter(a => a.roomId === req.params.roomId));
});

router.post('/attendance/mark', requireAuth, (req, res) => {
  const db = loadData();
  const { roomId, seatId, method, confidence } = req.body;
  const existing = db.attendance.find(
    a => a.studentId === req.session.user.id && a.roomId === roomId &&
      new Date(a.timestamp).toDateString() === new Date().toDateString()
  );
  if (existing) return res.json({ success: true, message: 'Already marked', record: existing });
  const record = {
    id: `att${Date.now()}`,
    studentId: req.session.user.id,
    studentName: req.session.user.name,
    rollNo: req.session.user.rollNo,
    roomId, seatId,
    timestamp: new Date().toISOString(),
    method: method || 'QR',
    confidence: confidence || 1.0,
    status: 'present'
  };
  db.attendance.push(record);
  saveData(db);
  res.json({ success: true, record });
});

router.get('/attendance/export/:roomId', requireFaculty, (req, res) => {
  const db = loadData();
  const records = db.attendance.filter(a => a.roomId === req.params.roomId);
  const csv = ['Roll No,Name,Room,Seat,Status,Time,Method']
    .concat(records.map(r => `${r.rollNo||''},${r.studentName},${r.roomId},${r.seatLabel||''},${r.status},${r.timestamp},${r.method}`))
    .join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="attendance_${req.params.roomId}.csv"`);
  res.send(csv);
});

// QR CODE
router.get('/rooms/:roomId/qr', requireAuth, async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const url = `${baseUrl}/student?room=${req.params.roomId}`;
    const qr = await QRCode.toDataURL(url, { width: 300, margin: 2, color: { dark: '#000', light: '#fff' } });
    res.json({ qr, url });
  } catch (e) {
    res.status(500).json({ error: 'QR generation failed' });
  }
});

// DASHBOARD STATS
router.get('/dashboard/stats', requireAuth, (req, res) => {
  const db = loadData();
  const today = new Date().toDateString();
  const todayAtt = db.attendance.filter(a => new Date(a.timestamp).toDateString() === today);
  res.json({
    totalRooms: db.rooms.length,
    activeRooms: db.rooms.filter(r => r.active).length,
    studentsToday: todayAtt.length,
    avgAttendance: 91.4,
    qrScans: todayAtt.filter(a => a.method === 'QR').length,
    faceDetections: todayAtt.filter(a => a.method === 'Face').length
  });
});

module.exports = router;
