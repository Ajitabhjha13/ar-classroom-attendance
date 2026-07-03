// data/store.js - In-memory data simulation

// Simulated classroom seats (e.g., a 5x6 grid = 30 seats)
let seats = [];
for (let row = 1; row <= 5; row++) {
  for (let col = 1; col <= 6; col++) {
    seats.push({
      id: `${row}-${col}`,
      row,
      col,
      occupied: false,
      studentId: null
    });
  }
}

// Simulated students
let students = [
  { id: 'S001', name: 'Aarav Sharma', rollNo: '101' },
  { id: 'S002', name: 'Diya Patel', rollNo: '102' },
  { id: 'S003', name: 'Kabir Singh', rollNo: '103' },
  { id: 'S004', name: 'Ananya Reddy', rollNo: '104' },
  { id: 'S005', name: 'Vihaan Gupta', rollNo: '105' }
];

// Attendance log: each entry records a check-in event
let attendanceLog = [];

// Current session info
let session = {
  active: false,
  roomId: 'room1',
  startedAt: null
};

module.exports = {
  seats,
  students,
  attendanceLog,
  session
};