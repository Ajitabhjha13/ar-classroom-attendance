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
  const seats = await (await fetch('/api/seats')).json();
  const grid = document.getElementById('seatGrid');
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
});

// ----- SESSION CONTROL -----
document.getElementById('startSessionBtn').addEventListener('click', async () => {
  const res = await fetch('/api/session/start', { method: 'POST' });
  const session = await res.json();
  document.getElementById('sessionInfo').textContent = `Session started at ${new Date(session.startedAt).toLocaleTimeString()}`;
  loadStats();
});

document.getElementById('endSessionBtn').addEventListener('click', async () => {
  const res = await fetch('/api/session/end', { method: 'POST' });
  document.getElementById('sessionInfo').textContent = 'Session ended.';
  loadStats();
});

// ----- SOCKET.IO LIVE UPDATES -----
socket.on('connect', () => {
  console.log('Connected to server:', socket.id);
});

socket.on('attendanceUpdate', () => {
  loadStats();
  loadSeatMap();
  loadAttendanceLog();
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

// ----- INITIAL LOAD -----
loadStats();
loadSeatMap();
loadAttendanceLog();
loadQrCode();