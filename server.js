const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const { loadData, saveData, seedSeats } = require('./data/store');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', credentials: true } });

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionMiddleware = session({
  secret: 'arclass-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
});
app.use(sessionMiddleware);

// Share session with socket.io
io.use((socket, next) => {
  sessionMiddleware(socket.request, socket.request.res || {}, next);
});

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/api'));

// Static files — index: false so auth middleware controls /
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// Page routes
const pages = {
  '/': 'landing.html',
  '/login': 'login.html',
  '/signup': 'signup.html',
  '/dashboard': 'dashboard.html',
  '/student': 'student.html',
  '/ar': 'ar.html',
};

Object.entries(pages).forEach(([route, file]) => {
  app.get(route, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', file));
  });
});

// SOCKET.IO — Real-time seat updates
io.on('connection', (socket) => {
  const user = socket.request.session?.user;

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    seedSeats(roomId);
    const db = loadData();
    const seats = db.seats.filter(s => s.roomId === roomId);
    socket.emit('seats-state', seats);
  });

  socket.on('claim-seat', ({ roomId, seatId, method }) => {
    if (!user) return socket.emit('error', { msg: 'Not authenticated' });
    const db = loadData();
    const seat = db.seats.find(s => s.id === seatId);
    if (!seat || seat.status === 'occupied') {
      return socket.emit('seat-error', { msg: 'Seat unavailable' });
    }
    seat.status = 'occupied';
    seat.student = user.name;
    seat.studentId = user.id;
    seat.checkedInAt = new Date().toISOString();
    seat.method = method || 'QR';

    // Record attendance
    const alreadyMarked = db.attendance.find(
      a => a.studentId === user.id && a.roomId === roomId &&
        new Date(a.timestamp).toDateString() === new Date().toDateString()
    );
    if (!alreadyMarked) {
      db.attendance.push({
        id: `att${Date.now()}`,
        studentId: user.id, studentName: user.name,
        rollNo: user.rollNo, roomId, seatId,
        seatLabel: seat.label,
        timestamp: new Date().toISOString(),
        method: seat.method, status: 'present'
      });
    }
    saveData(db);

    // Broadcast to everyone in the room
    const updatedSeats = db.seats.filter(s => s.roomId === roomId);
    io.to(roomId).emit('seats-state', updatedSeats);
    socket.emit('seat-claimed', { seat, msg: `Seat ${seat.label} confirmed!` });
  });

  socket.on('face-detected', ({ roomId, seatId, confidence }) => {
    if (!user || confidence < 0.85) return;
    socket.emit('attendance-auto-marked', { confidence, method: 'Face' });
    // Trigger same as claim
    socket.emit('claim-seat', { roomId, seatId, method: 'Face' });
  });

  socket.on('release-seat', ({ roomId, seatId }) => {
    if (!user || user.role !== 'faculty') return;
    const db = loadData();
    const seat = db.seats.find(s => s.id === seatId);
    if (seat) {
      seat.status = 'available';
      seat.student = null; seat.studentId = null;
      seat.checkedInAt = null; seat.method = null;
      saveData(db);
      io.to(roomId).emit('seats-state', db.seats.filter(s => s.roomId === roomId));
    }
  });

  socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🚀 AR Classroom running at http://localhost:${PORT}`);
  console.log(`   Demo login → faculty@demo.com / password`);
  console.log(`   Demo login → student@demo.com / password\n`);
});
