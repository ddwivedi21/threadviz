# ThreadViz: Behind the Scenes of Synchronization

Interactive real-time visualization platform for understanding Operating System concurrency and CPU scheduling concepts — built as part of an Operating Systems course project.

![Tech Stack](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-010101?logo=socket.io&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

## Team Apex (OS-V-T046)

| Member | Role |
|---|---|
| Uttam Verma (2023688) | Team Lead |
| Divyanshi Dwivedi (2023347) | Frontend Development, UI/UX, Visualization |

**Supervisor:** Dr. Neha Tripathi
**Institution:** Graphic Era (Deemed to be University), Dehradun

## Overview

ThreadViz simulates classic Operating System concurrency problems and CPU scheduling algorithms in real time, so users can visually trace how threads move through states, contend for shared resources, and get scheduled — instead of just reading about it in a textbook.

## Features

### Concurrency Problems
- **Producer-Consumer** — bounded buffer with semaphore-based synchronization (empty/full counters) and dynamic buffer sizing (1–20 slots)
- **Dining Philosophers** — classic deadlock scenario with live deadlock detection
- **Readers-Writers** — multiple concurrent readers, mutually exclusive writer access

### CPU Scheduling (independent module)
- First Come First Serve (FCFS)
- Round Robin (RR) with configurable time quantum
- Shortest Job First (SJF)
- Priority Scheduling
- Shortest Remaining Time First (SRTF)

### Visualization
- Real-time thread state tracking (Ready, Running, Blocked, Terminated)
- Gantt chart of execution history
- Live metrics: average wait time, average turnaround time, CPU utilization
- Adjustable simulation speed
- Event log panel

## Technology Stack

**Frontend:** React 19, JavaScript, Tailwind CSS, Lucide Icons
**Backend:** Node.js, Express.js, Socket.IO, CORS

## My Contributions (Divyanshi Dwivedi)

- Built the **frontend UI in React** — thread cards, buffer visualization, scenario switcher, and the Gantt chart display
- Implemented the **Producer-Consumer visualization**, including the bounded buffer grid and semaphore status display
- Added **dynamic buffer sizing (1–20 slots)** with live simulation reset on change
- Worked on **UI/UX design and interaction flow** — layout, color-coded thread states, responsive controls
- Contributed to **educational content design** — making abstract synchronization concepts (semaphores, mutexes) visually intuitive for first-time learners

## Installation

### Prerequisites
- Node.js 18+ ([nodejs.org](https://nodejs.org))
- npm (comes with Node.js)

### Setup

1. Clone the repository
   ```bash
   git clone https://github.com/YOUR_USERNAME/threadviz.git
   cd threadviz
   ```

2. Install backend dependencies
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies
   ```bash
   cd ../frontend
   npm install
   ```

4. Set up environment variables (see below)

5. Run the backend
   ```bash
   cd backend
   npm start
   ```

6. Run the frontend (in a separate terminal)
   ```bash
   cd frontend
   npm start
   ```

7. Open `http://localhost:3000` in your browser

##  Environment Variables

`backend/.env`
```
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
SESSION_SECRET=your-secret-key-change-in-production
```

`frontend/.env`
```
REACT_APP_BACKEND_URL=http://localhost:5000
REACT_APP_WS_URL=ws://localhost:5000
```

##  License

This project is licensed under the MIT License — see [LICENSE.txt](LICENSE.txt) for details.
