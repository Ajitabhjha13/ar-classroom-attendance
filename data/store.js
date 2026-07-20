const fs = require('fs');
const path = require('path');
const DB_PATH = path.join(__dirname, 'db.json');

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    return { users: [], rooms: [], seats: [], attendance: [], sessions: [] };
  }
}

function saveData(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Seed seat map for a room if not present
function seedSeats(roomId) {
  const db = loadData();
  const room = db.rooms.find(r => r.id === roomId);
  if (!room) return;
  const existing = db.seats.filter(s => s.roomId === roomId);
  if (existing.length > 0) return;

  const rows = ['A','B','C','D','E'].slice(0, room.rows);
  const statuses = ['available','occupied','occupied','occupied','reserved','empty'];
  const names = ['Raj Kumar','Ananya Patel','Mihir Shah','Priya Thakkar','Arjun Mehta',
    'Sneha Rao','Dhruv Patel','Kavya Nair','Rohan Desai','Isha Gupta',
    'Amit Joshi','Pooja Verma','Siddharth Rao','Meera Singh','Kiran Patel'];

  let nameIdx = 0;
  rows.forEach(row => {
    for (let c = 1; c <= room.cols; c++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const label = `${row}-${String(c).padStart(2,'0')}`;
      const mins = Math.floor(Math.random() * 30);
      db.seats.push({
        id: `${roomId}-${label}`,
        roomId,
        label,
        row,
        col: c,
        status,
        student: status === 'occupied' ? names[nameIdx++ % names.length] : null,
        studentId: status === 'occupied' ? `s${nameIdx}` : null,
        checkedInAt: status === 'occupied' ? new Date(Date.now() - mins * 60000).toISOString() : null,
        method: status === 'occupied' ? (Math.random() > 0.5 ? 'QR' : 'Face') : null
      });
    }
  });
  saveData(db);
}

module.exports = { loadData, saveData, seedSeats };
