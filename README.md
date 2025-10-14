# ThreadViz: Behind the Scenes of Synchronization

Interactive real-time visualization platform for understanding Operating System concurrency concepts.

## 🎯 Team Apex (OS-V-T046)

- **Uttam Verma** (2023688) - Team Lead
- **Divyanshi Dwivedi** (2023347)
- **Priyanka Joshi** (2023531)

**Supervisor:** Dr. Neha Tripathi  
**Institution:** Graphic Era (Deemed to be University), Dehradun

## ✨ Features

- **Real-time thread visualization** with 6-state lifecycle (NEW, READY, RUNNING, BLOCKED, WAITING, TERMINATED)
- **4 Classic Concurrency Problems:**
  - Producer-Consumer with bounded buffer
  - Dining Philosophers with deadlock detection
  - Readers-Writers with RW locks
  - Bounded Buffer with dynamic sizing
- **Complete Synchronization Primitives:** Semaphores, Mutexes, Reader-Writer Locks
- **Interactive Controls:** Dynamic buffer sizing, simulation speed control, thread management
- **Advanced Features:** Deadlock detection, event logging, progress tracking

## 🛠️ Technology Stack

**Frontend:** React.js 18.2.0, Lucide Icons, Tailwind CSS  
**Backend:** Node.js, Express.js, Socket.IO, CORS

## 🚀 Installation

### Prerequisites
- Node.js 18+ (https://nodejs.org)
- npm (comes with Node.js)

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/threadviz.git
cd threadviz