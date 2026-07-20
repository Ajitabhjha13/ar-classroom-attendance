# 📡 ARClass — AR Classroom Seating & Attendance System

> Semester Project — Zenith Institute of Technology  
> Tech Stack: Node.js · Express · Socket.io · A-Frame (WebXR) · TensorFlow.js · JSON DB

---

## 🚀 Quick Start (Run in 60 seconds)

```bash
# 1. Install dependencies
npm install

# 2. Start the server
node server.js

# 3. Open browser
http://localhost:3000
```

---

## 🔑 Demo Login Credentials

| Role    | Email                  | Password   |
|---------|------------------------|------------|
| Faculty | `faculty@demo.com`     | `password` |
| Student | `student@demo.com`     | `password` |

---

## 📁 Project Structure

```
ar-classroom-attendance/
├── server.js              # Main Express + Socket.io server
├── package.json
├── data/
│   ├── db.json            # JSON file database (persists across restarts)
│   └── store.js           # loadData() / saveData() helpers
├── routes/
│   ├── auth.js            # Login, Signup, Logout, /me
│   └── api.js             # Rooms, Seats, Attendance, QR, Stats
└── public/
    ├── style.css          # Shared design system
    ├── landing.html       # Hero landing page
    ├── login.html         # Faculty + Student login
    ├── signup.html        # Role-based signup
    ├── dashboard.html     # Faculty admin dashboard
    ├── student.html       # Student seat-claim portal
    └── ar.html            # A-Frame 3D AR seat map
```

---

## 🌐 All URLs

| URL           | Description                        |
|---------------|------------------------------------|
| `/`           | Landing page                       |
| `/login`      | Login (Faculty / Student)          |
| `/signup`     | Create account                     |
| `/dashboard`  | Faculty dashboard (protected)      |
| `/student`    | Student portal (protected)         |
| `/ar?room=room204` | A-Frame 3D AR seat map        |

---

## 🔌 API Endpoints

| Method | Endpoint                                | Description              |
|--------|-----------------------------------------|--------------------------|
| POST   | `/api/auth/login`                       | Login                    |
| POST   | `/api/auth/signup`                      | Register                 |
| POST   | `/api/auth/logout`                      | Logout                   |
| GET    | `/api/auth/me`                          | Current user             |
| GET    | `/api/rooms`                            | List all rooms           |
| POST   | `/api/rooms`                            | Add room (faculty only)  |
| GET    | `/api/rooms/:id/seats`                  | Get seat map             |
| POST   | `/api/rooms/:id/seats/:sid/claim`       | Claim a seat             |
| POST   | `/api/rooms/:id/seats/:sid/release`     | Release a seat (faculty) |
| GET    | `/api/rooms/:id/attendance`             | Get attendance records   |
| GET    | `/api/rooms/:id/qr`                     | Generate QR code         |
| GET    | `/api/attendance/export/:roomId`        | Export CSV               |
| GET    | `/api/dashboard/stats`                  | Dashboard stats          |

---

## ⚡ Real-Time Socket.io Events

| Event (Client → Server) | Description                      |
|--------------------------|----------------------------------|
| `join-room`              | Join a room's socket channel     |
| `claim-seat`             | Claim an available seat          |
| `release-seat`           | Release a seat (faculty)         |
| `face-detected`          | TF.js face detection result      |

| Event (Server → Client) | Description                      |
|--------------------------|----------------------------------|
| `seats-state`            | Full seat map update             |
| `seat-claimed`           | Seat claim confirmed             |
| `seat-error`             | Seat unavailable error           |
| `attendance-auto-marked` | Face detection marked attendance |

---

## 🏗️ System Architecture

```
Student Phone (Browser)
    │
    ├── Scans QR Code on classroom door
    ├── Opens /ar?room=room204  (WebXR / A-Frame)
    ├── Sees 3D seat map overlay
    ├── Taps available seat
    │
    ▼
Socket.io (Real-time)  ←→  Express API (REST)
    │                            │
    ▼                            ▼
data/db.json  ←─────────  routes/api.js
(Persistent)             (Auth + CRUD)
    │
    ▼
Faculty Dashboard (/dashboard)
    ├── Live seat map
    ├── Attendance table
    ├── QR generator
    ├── CSV export
    └── Analytics
```

---

## 🎯 Key Features

- **WebXR AR** — A-Frame 3D interactive seat map (camera-ready)
- **QR Anchoring** — Room-specific QR codes link to live seat maps
- **Real-time** — Socket.io broadcasts seat changes to all connected users instantly
- **Face Detection** — TensorFlow.js BlazeFace integration (>85% confidence auto-marks)
- **Role Auth** — Faculty vs Student with bcrypt + express-session
- **JSON Persistence** — Data survives server restarts via `data/db.json`
- **CSV Export** — Download attendance records as spreadsheet
- **Dark UI** — Polished Space Grotesk design with animated elements

---

## 🛠️ Tech Stack Details

| Layer      | Technology                       |
|------------|----------------------------------|
| Server     | Node.js 18+ / Express 4          |
| Real-time  | Socket.io 4                      |
| AR/3D      | A-Frame 1.4 (WebXR)              |
| Auth       | bcryptjs + express-session       |
| Face Det.  | TensorFlow.js BlazeFace          |
| QR Code    | qrcode npm package               |
| Database   | JSON file (db.json)              |
| Frontend   | Vanilla JS + CSS Variables       |

---

## 📋 Viva Presentation Flow

1. Show landing page → explain the problem (manual roll calls)
2. Log in as **Faculty** → show Dashboard stats, seat map, QR generator
3. Download/display the QR code for Room 204
4. Open `/ar?room=room204` → show 3D A-Frame seat map
5. Log in as **Student** in another tab → claim a seat
6. Switch back to Faculty tab → show real-time seat update
7. Show Attendance tab → present/method/time recorded
8. Export CSV → show the downloaded file

---

*Built with ❤️ for Semester Project Demo*
