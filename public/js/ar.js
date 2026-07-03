// public/js/ar.js

async function loadArData() {
  try {
    const seats = await (await fetch('/api/seats')).json();
    const occupied = seats.filter(s => s.occupied).length;

    document.getElementById('occupancyStat').textContent =
      `${occupied} / ${seats.length} Seats Occupied`;

    renderSeats(seats);
  } catch (err) {
    console.error('Failed to load AR data:', err);
  }
}

function renderSeats(seats) {
  const container = document.getElementById('seatContainer');
  container.innerHTML = '';

  seats.forEach(seat => {
    const box = document.createElement('a-box');
    const x = (seat.col - 1) * 1.5;
    const z = (seat.row - 1) * 1.5;
    box.setAttribute('position', `${x} 0.25 ${z}`);
    box.setAttribute('depth', '0.6');
    box.setAttribute('height', '0.5');
    box.setAttribute('width', '0.6');
    box.setAttribute('color', seat.occupied ? '#3b82f6' : '#cbd5e1');
    container.appendChild(box);
  });
}

loadArData();
setInterval(loadArData, 5000); // refresh every 5 seconds