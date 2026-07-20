// public/js/student.js

const socket = io();

let currentUser = null;
let selectedSeatId = null;

// ----- CHECK LOGIN AND GET CURRENT USER -----
async function loadCurrentUser() {
  const res = await fetch('/auth/me');
  const data = await res.json();

  if (!data.loggedIn) {
    window.location.href = '/student-login';
    return;
  }

  currentUser = data.user;
  document.getElementById('welcomeMessage').textContent = `Welcome, ${currentUser.name}!`;
}

// ----- LOAD SEAT MAP FOR SELECTION -----
async function loadSeatMap() {
  const grid = document.getElementById('studentSeatGrid');
  grid.innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';

  const seats = await (await fetch('/api/seats')).json();
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

// ----- ENABLE CHECK-IN BUTTON ONLY WHEN SEAT IS SELECTED -----
function updateCheckinButton() {
  document.getElementById('checkinBtn').disabled = !selectedSeatId;
}

// ----- HANDLE CHECK-IN -----
document.getElementById('checkinBtn').addEventListener('click', async () => {
  const res = await fetch('/api/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId: currentUser.id, seatId: selectedSeatId })
  });

  const data = await res.json();

  if (data.success) {
    showToast(`Checked in successfully to seat ${selectedSeatId}!`, 'success');
    document.getElementById('checkinBtn').disabled = true;
    loadSeatMap();
  } else {
    showToast(data.error || 'Check-in failed.', 'error');
  }
});

// ----- LOGOUT -----
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/auth/logout', { method: 'POST' });
  window.location.href = '/student-login';
});

// ----- LIVE UPDATES -----
socket.on('attendanceUpdate', () => {
  loadSeatMap();
});

// ----- INITIAL LOAD -----
loadCurrentUser();
loadSeatMap();