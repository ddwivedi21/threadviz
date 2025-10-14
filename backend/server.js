/**
 * ThreadViz Backend Server
 * Handles scenario management, session handling, and real-time communication
 * Team Apex (OS-V-T046)
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*", // Configure based on your frontend URL in production
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Port configuration
const PORT = process.env.PORT || 5000;

/**
 * Predefined Educational Scenarios
 * These scenarios demonstrate common concurrency patterns
 */
const SCENARIOS = {
  'producer-consumer': {
    id: 'producer-consumer',
    name: 'Producer-Consumer Problem',
    description: 'Classic synchronization problem with bounded buffer',
    config: {
      producers: 2,
      consumers: 2,
      bufferSize: 5,
      primitives: ['semaphore', 'mutex']
    },
    difficulty: 'medium'
  },
  'dining-philosophers': {
    id: 'dining-philosophers',
    name: 'Dining Philosophers Problem',
    description: 'Demonstrates deadlock and resource allocation',
    config: {
      philosophers: 5,
      primitives: ['mutex'],
      canDeadlock: true
    },
    difficulty: 'hard'
  },
  'readers-writers': {
    id: 'readers-writers',
    name: 'Readers-Writers Problem',
    description: 'Multiple readers, single writer synchronization',
    config: {
      readers: 3,
      writers: 2,
      primitives: ['rwlock', 'semaphore']
    },
    difficulty: 'medium'
  },
  'bounded-buffer': {
    id: 'bounded-buffer',
    name: 'Bounded Buffer',
    description: 'Circular buffer with producer-consumer pattern',
    config: {
      bufferSize: 10,
      producers: 3,
      consumers: 2,
      primitives: ['semaphore', 'mutex']
    },
    difficulty: 'easy'
  }
};

/**
 * Active simulation sessions
 * Stores state for each connected client
 */
const activeSessions = new Map();

/**
 * Session Management Class
 * Handles individual user simulation sessions
 */
class SimulationSession {
  constructor(socketId) {
    this.socketId = socketId;
    this.scenario = null;
    this.isRunning = false;
    this.threads = [];
    this.primitives = {};
    this.createdAt = new Date();
    this.eventLog = [];
  }

  /**
   * Load a predefined scenario
   */
  loadScenario(scenarioId) {
    const scenario = SCENARIOS[scenarioId];
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }
    this.scenario = scenario;
    this.eventLog.push({
      timestamp: new Date().toISOString(),
      type: 'scenario_loaded',
      message: `Loaded scenario: ${scenario.name}`
    });
    return scenario;
  }

  /**
   * Add event to session log
   */
  addEvent(type, message, data = {}) {
    this.eventLog.push({
      timestamp: new Date().toISOString(),
      type,
      message,
      data
    });
  }

  /**
   * Get session statistics
   */
  getStats() {
    return {
      sessionId: this.socketId,
      scenario: this.scenario?.name || 'None',
      threadsCreated: this.threads.length,
      eventsLogged: this.eventLog.length,
      uptime: Date.now() - this.createdAt.getTime(),
      isRunning: this.isRunning
    };
  }
}

/**
 * REST API Endpoints
 */

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ThreadViz Backend',
    version: '1.0.0',
    activeSessions: activeSessions.size,
    timestamp: new Date().toISOString()
  });
});

// Get all available scenarios
app.get('/api/scenarios', (req, res) => {
  res.json({
    success: true,
    scenarios: Object.values(SCENARIOS),
    count: Object.keys(SCENARIOS).length
  });
});

// Get specific scenario details
app.get('/api/scenarios/:id', (req, res) => {
  const scenario = SCENARIOS[req.params.id];
  if (!scenario) {
    return res.status(404).json({
      success: false,
      error: 'Scenario not found'
    });
  }
  res.json({
    success: true,
    scenario
  });
});

// Get system statistics
app.get('/api/stats', (req, res) => {
  const sessions = Array.from(activeSessions.values()).map(s => s.getStats());
  res.json({
    success: true,
    totalSessions: activeSessions.size,
    sessions,
    scenarios: Object.keys(SCENARIOS).length,
    timestamp: new Date().toISOString()
  });
});

/**
 * Socket.IO Real-time Communication
 * Handles bidirectional communication between client and server
 */
io.on('connection', (socket) => {
  console.log(`[${new Date().toISOString()}] Client connected: ${socket.id}`);
  
  // Create new session for this connection
  const session = new SimulationSession(socket.id);
  activeSessions.set(socket.id, session);

  // Send welcome message
  socket.emit('connected', {
    sessionId: socket.id,
    message: 'Connected to ThreadViz server',
    availableScenarios: Object.keys(SCENARIOS)
  });

  /**
   * Load a scenario
   */
  socket.on('load_scenario', (data) => {
    try {
      const scenario = session.loadScenario(data.scenarioId);
      socket.emit('scenario_loaded', {
        success: true,
        scenario
      });
      console.log(`[${socket.id}] Loaded scenario: ${data.scenarioId}`);
    } catch (error) {
      socket.emit('error', {
        message: error.message
      });
    }
  });

  /**
   * Start simulation
   */
  socket.on('start_simulation', () => {
    session.isRunning = true;
    session.addEvent('simulation_started', 'Simulation started by user');
    socket.emit('simulation_state_changed', {
      isRunning: true
    });
    console.log(`[${socket.id}] Simulation started`);
  });

  /**
   * Pause simulation
   */
  socket.on('pause_simulation', () => {
    session.isRunning = false;
    session.addEvent('simulation_paused', 'Simulation paused by user');
    socket.emit('simulation_state_changed', {
      isRunning: false
    });
    console.log(`[${socket.id}] Simulation paused`);
  });

  /**
   * Reset simulation
   */
  socket.on('reset_simulation', () => {
    session.isRunning = false;
    session.threads = [];
    session.primitives = {};
    session.eventLog = [];
    session.addEvent('simulation_reset', 'Simulation reset by user');
    socket.emit('simulation_reset', {
      success: true
    });
    console.log(`[${socket.id}] Simulation reset`);
  });

  /**
   * Thread creation event
   */
  socket.on('thread_created', (data) => {
    session.threads.push(data);
    session.addEvent('thread_created', `Thread ${data.id} created`, data);
    
    // Broadcast to all clients in the same room (for collaborative features)
    socket.broadcast.emit('thread_update', {
      type: 'created',
      thread: data
    });
    
    console.log(`[${socket.id}] Thread created: ${data.id}`);
  });

  /**
   * Thread state change event
   */
  socket.on('thread_state_changed', (data) => {
    session.addEvent('thread_state_changed', 
      `Thread ${data.threadId} changed state: ${data.oldState} -> ${data.newState}`, 
      data
    );
    console.log(`[${socket.id}] Thread ${data.threadId}: ${data.oldState} -> ${data.newState}`);
  });

  /**
   * Lock acquired event
   */
  socket.on('lock_acquired', (data) => {
    session.addEvent('lock_acquired', 
      `Thread ${data.threadId} acquired ${data.lockType}`, 
      data
    );
    console.log(`[${socket.id}] Lock acquired by thread ${data.threadId}`);
  });

  /**
   * Lock released event
   */
  socket.on('lock_released', (data) => {
    session.addEvent('lock_released', 
      `Thread ${data.threadId} released ${data.lockType}`, 
      data
    );
    console.log(`[${socket.id}] Lock released by thread ${data.threadId}`);
  });

  /**
   * Get session statistics
   */
  socket.on('get_stats', () => {
    socket.emit('stats_update', session.getStats());
  });

  /**
   * Get event log
   */
  socket.on('get_event_log', () => {
    socket.emit('event_log', {
      events: session.eventLog,
      count: session.eventLog.length
    });
  });

  /**
   * Client disconnection
   */
  socket.on('disconnect', () => {
    console.log(`[${new Date().toISOString()}] Client disconnected: ${socket.id}`);
    activeSessions.delete(socket.id);
  });

  /**
   * Error handling
   */
  socket.on('error', (error) => {
    console.error(`[${socket.id}] Socket error:`, error);
    session.addEvent('error', error.message);
  });
});

/**
 * Error handling middleware
 */
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

/**
 * Start server
 */
server.listen(PORT, () => {
  console.log('=================================');
  console.log('   ThreadViz Backend Server');
  console.log('   Team Apex (OS-V-T046)');
  console.log('=================================');
  console.log(`Server running on port ${PORT}`);
  console.log(`Available scenarios: ${Object.keys(SCENARIOS).length}`);
  console.log(`WebSocket enabled for real-time communication`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log('=================================');
});

/**
 * Graceful shutdown handling
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };
