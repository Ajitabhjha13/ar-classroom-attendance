// public/js/student.js

const socket = io();

let selectedStudentId = null;
let selectedSeatId = null;

// ----- LOAD STUDENTS INTO DROPDOWN -----
async function loadStudents() {
  const students = await (await fetch('/api/students')).json();
  const select = document.getElementById('studentSelect');

  students.forEach(student => {
    const option = document.createElement('option');
    option.value = student.id;
    option.textContent = `${student.name} (Roll No: ${student.rollNo})`;
    select.appendChild(option);
  });
}

document.getElementById('studentSelect').addEventListener('change', (e) => {
  selectedStudentId = e.target.value || null;
  updateCheckinButton();
});

// ----- LOAD SEAT MAP FOR SELECTION -----
async function loadSeatMap() {
  const seats = await (await fetch('/api/seats')).json();
  const grid = document.getElementById('studentSeatGrid');
  grid.innerHTML = '';

  seats.forEach(seat => {
    const div = document.createElement('div');
    div.className = 'seat' + (seat.occupied ? ' taken' : '');
    div.textContent = seat.id;

    if (!seat.occupied) {
      div.addEventListener('click', () => {
        document.querySelectorAll('.seat').forEach(s => s.classList.remove('selected'));
        div.classList.add('selected');
        selectedSeatId = seat.id;
        updateCheckinButton();
      });
    }

    grid.appendChild(div);
  });
}

// ----- ENABLE CHECK-IN BUTTON ONLY WHEN BOTH ARE SELECTED -----
function updateCheckinButton() {
  document.getElementById('checkinBtn').disabled = !(selectedStudentId && selectedSeatId);
}

// ----- HANDLE CHECK-IN -----
document.getElementById('checkinBtn').addEventListener('click', async () => {
  const res = await fetch('/api/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId: selectedStudentId, seatId: selectedSeatId })
  });

  const data = await res.json();

  if (data.success) {
    document.getElementById('checkinMessage').textContent =
      `Checked in successfully to seat ${selectedSeatId}!`;
    document.getElementById('checkinBtn').disabled = true;
    loadSeatMap();
  } else {
    document.getElementById('checkinMessage').textContent = data.error || 'Check-in failed.';
  }
});

// ----- LIVE UPDATES -----
socket.on('attendanceUpdate', () => {
  loadSeatMap();
});

// ----- INITIAL LOAD -----
loadStudents();
loadSeatMap();