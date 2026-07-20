// public/js/dashboard.js

const socket = io();

// ----- TAB SWITCHING -----
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    tabPanels.forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// ----- LOAD OVERVIEW STATS -----
async function loadStats() {
  const statIds = ['totalSeats', 'occupiedSeats', 'totalStudents', 'sessionStatus'];
  statIds.forEach(id => {
    document.getElementById(id).innerHTML = '<span class="skeleton skeleton-text"></span>';
  });

  const seats = await (await fetch('/api/seats')).json();
  const students = await (await fetch('/api/students')).json();
  const session = await (await fetch('/api/session')).json();

  const occupiedCount = seats.filter(s => s.occupied).length;

  document.getElementById('totalSeats').textContent = seats.length;
  document.getElementById('occupiedSeats').textContent = occupiedCount;
  document.getElementById('totalStudents').textContent = students.length;
  document.getElementById('sessionStatus').textContent = session.active ? 'Active' : 'Inactive';
}

// ----- LOAD SEAT MAP -----
async function loadSeatMap() {
  const grid = document.getElementById('seatGrid');
  grid.innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';

  const seats = await (await fetch('/api/seats')).json();
  grid.innerHTML = '';

  seats.forEach(seat => {
    const div = document.createElement('div');
    div.className = 'seat' + (seat.occupied ? ' occupied' : '');
    div.textContent = seat.id;
    div.title = seat.occupied ? `Occupied by ${seat.studentId}` : 'Empty';
    grid.appendChild(div);
  });
}

// ----- LOAD ATTENDANCE LOG -----
async function loadAttendanceLog() {
  const log = await (await fetch('/api/attendance')).json();
  const tbody = document.querySelector('#attendanceTable tbody');
  tbody.innerHTML = '';

  log.forEach(entry => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${entry.studentName}</td>
      <td>${entry.seatId}</td>
      <td>${new Date(entry.timestamp).toLocaleTimeString()}</td>
    `;
    tbody.appendChild(row);
  });
}

// ----- CSV EXPORT -----
document.getElementById('exportCsvBtn').addEventListener('click', async () => {
  const log = await (await fetch('/api/attendance')).json();

  let csv = 'Student,Seat,Time\n';
  log.forEach(entry => {
    csv += `${entry.studentName},${entry.seatId},${entry.timestamp}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'attendance.csv';
  a.click();

  showToast('Attendance exported as CSV!', 'success');
});

// ----- PDF EXPORT -----
document.getElementById('exportPdfBtn').addEventListener('click', async () => {
  const log = await (await fetch('/api/attendance')).json();
  const session = await (await fetch('/api/session')).json();

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Header
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text('AR Classroom Attendance Report', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
  doc.text(`Session status: ${session.active ? 'Active' : 'Inactive'}`, 14, 34);
  doc.text(`Total check-ins: ${log.length}`, 14, 40);

  // Table header
  let y = 52;
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.setFillColor(59, 130, 246);
  doc.rect(14, y - 6, 182, 8, 'F');
  doc.text('Student', 18, y);
  doc.text('Seat', 110, y);
  doc.text('Time', 150, y);

  // Table rows
  y += 10;
  doc.setTextColor(30, 41, 59);
  log.forEach((entry, index) => {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    if (index % 2 === 0) {
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y - 6, 182, 8, 'F');
    }
    doc.text(entry.studentName, 18, y);
    doc.text(entry.seatId, 110, y);
    doc.text(new Date(entry.timestamp).toLocaleTimeString(), 150, y);
    y += 10;
  });

  doc.save('attendance-report.pdf');
  showToast('Attendance exported as PDF!', 'success');
});

// ----- SESSION CONTROL -----
document.getElementById('startSessionBtn').addEventListener('click', async () => {
  const res = await fetch('/api/session/start', { method: 'POST' });
  const session = await res.json();
  document.getElementById('sessionInfo').textContent = `Session started at ${new Date(session.startedAt).toLocaleTimeString()}`;
  showToast('Session started successfully!', 'success');
  loadStats();
});

document.getElementById('endSessionBtn').addEventListener('click', async () => {
  const res = await fetch('/api/session/end', { method: 'POST' });
  document.getElementById('sessionInfo').textContent = 'Session ended.';
  showToast('Session ended.', 'info');
  loadStats();
});

// ----- SOCKET.IO LIVE UPDATES -----
socket.on('connect', () => {
  console.log('Connected to server:', socket.id);
});

socket.on('attendanceUpdate', (entry) => {
  loadStats();
  loadSeatMap();
  loadAttendanceLog();
  if (entry && entry.studentName) {
    showToast(`${entry.studentName} checked in to seat ${entry.seatId}`, 'info');
  }
});

// ----- LOAD QR CODE -----
async function loadQrCode() {
  const data = await (await fetch('/api/qrcode')).json();
  const container = document.getElementById('qrCodeContainer');
  container.innerHTML = `
    <img src="${data.qrDataUrl}" alt="Check-in QR Code" style="width:180px; height:180px;">
    <p style="margin-top:10px; font-size:13px; color:#64748b;">${data.url}</p>
  `;
}

// ----- LOGOUT -----
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/auth/logout', { method: 'POST' });
  window.location.href = '/faculty-login';
});

// ----- INITIAL LOAD -----
loadStats();
loadSeatMap();
loadAttendanceLog();
loadQrCode();