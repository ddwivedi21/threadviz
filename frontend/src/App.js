import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Plus, Trash2, Activity, AlertCircle, Clock, Database, Utensils, Book, Users, Info, BarChart3, Cpu } from 'lucide-react';

const THREAD_STATES = {
  READY: { color: 'bg-blue-500', label: 'Ready' },
  RUNNING: { color: 'bg-green-500', label: 'Running' },
  BLOCKED: { color: 'bg-red-500', label: 'Blocked' },
  TERMINATED: { color: 'bg-gray-600', label: 'Terminated' }
};

const ALGORITHMS = {
  FCFS: 'First Come First Serve',
  RR: 'Round Robin',
  SJF: 'Shortest Job First',
  PRIORITY: 'Priority',
  SRTF: 'Shortest Remaining Time'
};

const ThreadViz = () => {
  const [scenario, setScenario] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [threads, setThreads] = useState([]);
  const [buffer, setBuffer] = useState([]);
  const [semaphores, setSemaphores] = useState({});
  const [logs, setLogs] = useState([]);
  const [algorithm, setAlgorithm] = useState('RR');
  const [quantum, setQuantum] = useState(3);
  const [currentQ, setCurrentQ] = useState(0);
  const [gantt, setGantt] = useState([]);
  const [philStates, setPhilStates] = useState({});
  const [forks, setForks] = useState([]);
  const [deadlock, setDeadlock] = useState(false);
  const [readers, setReaders] = useState(0);
  const [writer, setWriter] = useState(null);
  const [speed, setSpeed] = useState(1000);
  const [bufferSize, setBufferSize] = useState(5);
  
  const animRef = useRef(null);
  const idCounter = useRef(0);
  const simTime = useRef(0);

  const addLog = (msg) => {
    setLogs(p => [{ id: Date.now(), msg, time: new Date().toLocaleTimeString() }, ...p].slice(0, 50));
  };

  const createThread = (type, name, idx) => {
    const burst = Math.floor(Math.random() * 8) + 3;
    return {
      id: `t${idCounter.current++}`,
      name,
      type,
      idx,
      state: 'READY',
      priority: Math.floor(Math.random() * 10) + 1,
      burst,
      remaining: burst,
      arrivalTime: simTime.current,
      waiting: 0,
      progress: 0,
      action: null,
      blockedOn: null,
      color: type === 'producer' ? 'bg-green-500' : type === 'consumer' ? 'bg-blue-500' : type === 'philosopher' ? 'bg-purple-500' : type === 'reader' ? 'bg-cyan-500' : 'bg-red-500'
    };
  };

  const initScenario = (type) => {
    idCounter.current = 0;
    simTime.current = 0;
    setGantt([]);
    setCurrentQ(0);
    let newThreads = [];

    if (type === 'pc') {
      setBuffer(Array(bufferSize).fill(null));
      setSemaphores({ empty: bufferSize, full: 0 });
      for (let i = 0; i < 2; i++) newThreads.push(createThread('producer', `Producer ${i + 1}`, i));
      for (let i = 0; i < 2; i++) newThreads.push(createThread('consumer', `Consumer ${i + 1}`, i));
    } else if (type === 'phil') {
      const n = 5;
      setForks(Array(n).fill(true));
      const states = {};
      for (let i = 0; i < n; i++) {
        newThreads.push(createThread('philosopher', `Phil ${i + 1}`, i));
        states[i] = 'thinking';
      }
      setPhilStates(states);
    } else if (type === 'rw') {
      setReaders(0);
      setWriter(null);
      for (let i = 0; i < 3; i++) newThreads.push(createThread('reader', `Reader ${i + 1}`, i));
      for (let i = 0; i < 2; i++) newThreads.push(createThread('writer', `Writer ${i + 1}`, i));
    }

    setThreads(newThreads);
    setScenario(type);
    setDeadlock(false);
    addLog(`Initialized scenario with ${ALGORITHMS[algorithm]}`);
  };

  const handleBufferSizeChange = (newSize) => {
    const clamped = Math.max(1, Math.min(20, newSize));
    setBufferSize(clamped);
    if (scenario === 'pc') {
      setIsRunning(false);
      setBuffer(Array(clamped).fill(null));
      setSemaphores({ empty: clamped, full: 0 });
      addLog(`Buffer size changed to ${clamped}`);
    }
  };

  const selectNext = (ready) => {
    if (!ready.length) return null;
    
    switch(algorithm) {
      case 'FCFS':
        return ready.sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
      case 'SJF':
        return ready.sort((a, b) => a.burst - b.burst)[0];
      case 'SRTF':
        return ready.sort((a, b) => a.remaining - b.remaining)[0];
      case 'PRIORITY':
        return ready.sort((a, b) => b.priority - a.priority)[0];
      case 'RR':
        const running = ready.find(t => t.state === 'RUNNING');
        if (running && currentQ < quantum) return running;
        const next = ready.filter(t => t.state !== 'RUNNING')[0];
        if (next) setCurrentQ(0);
        return next || ready[0];
      default:
        return ready[0];
    }
  };

  const step = () => {
    if (!scenario) return;

    setThreads(prev => {
      const updated = [...prev];
      
      updated.forEach(t => {
        if (t.state === 'READY' && t.remaining > 0) t.waiting++;
        if (t.state === 'RUNNING') t.state = 'READY';
      });

      const ready = updated.filter(t => (t.state === 'READY' || t.state === 'RUNNING') && t.remaining > 0 && !t.blockedOn);
      
      if (!ready.length) {
        const blocked = updated.filter(t => t.state === 'BLOCKED');
        if (blocked.length && Math.random() > 0.6) {
          const unblock = blocked[Math.floor(Math.random() * blocked.length)];
          unblock.state = 'READY';
          unblock.blockedOn = null;
        }
        return updated;
      }

      const next = selectNext(ready);
      if (!next) return updated;

      const idx = updated.findIndex(t => t.id === next.id);
      if (idx === -1) return updated;

      const current = updated[idx];
      
      if (algorithm === 'RR') {
        if (currentQ >= quantum) {
          setCurrentQ(0);
          current.state = 'READY';
          return updated;
        }
        setCurrentQ(p => p + 1);
      }

      current.state = 'RUNNING';
      current.remaining--;

      setGantt(p => [...p, { id: current.id, name: current.name, time: simTime.current, color: current.color }].slice(-40));

      executeWork(current);

      current.progress = Math.round(((current.burst - current.remaining) / current.burst) * 100);
      
      if (current.remaining <= 0) {
        current.state = 'TERMINATED';
        addLog(`${current.name} completed`);
        setCurrentQ(0);
      }

      return updated;
    });

    simTime.current++;
    if (scenario === 'phil') checkDeadlock();
  };

  const executeWork = (t) => {
    if (scenario === 'pc') {
      if (t.type === 'producer') producerWork(t);
      else consumerWork(t);
    } else if (scenario === 'phil') {
      philWork(t);
    } else if (scenario === 'rw') {
      if (t.type === 'reader') readerWork(t);
      else writerWork(t);
    }
  };

  const producerWork = (t) => {
    setSemaphores(s => {
      if (s.empty > 0) {
        setBuffer(b => {
          const nb = [...b];
          const idx = nb.findIndex(x => x === null);
          if (idx !== -1) {
            const val = Math.floor(Math.random() * 100);
            nb[idx] = { val, by: t.name, color: t.color };
            t.action = `Produced ${val}`;
          }
          return nb;
        });
        return { empty: s.empty - 1, full: s.full + 1 };
      } else {
        t.state = 'BLOCKED';
        t.blockedOn = 'Buffer Full';
      }
      return s;
    });
  };

  const consumerWork = (t) => {
    setSemaphores(s => {
      if (s.full > 0) {
        setBuffer(b => {
          const nb = [...b];
          const idx = nb.findIndex(x => x !== null);
          if (idx !== -1) {
            t.action = `Consumed ${nb[idx].val}`;
            nb[idx] = null;
          }
          return nb;
        });
        return { empty: s.empty + 1, full: s.full - 1 };
      } else {
        t.state = 'BLOCKED';
        t.blockedOn = 'Buffer Empty';
      }
      return s;
    });
  };

  const philWork = (t) => {
    const i = t.idx;
    const l = i;
    const r = (i + 1) % forks.length;

    setForks(f => {
      const nf = [...f];
      setPhilStates(p => {
        const ns = { ...p };
        const state = ns[i];

        if (state === 'thinking') {
          ns[i] = 'hungry';
          t.action = 'Hungry';
        } else if (state === 'hungry') {
          if (nf[l] && nf[r]) {
            nf[l] = false;
            nf[r] = false;
            ns[i] = 'eating';
            t.action = 'Eating';
          } else {
            t.state = 'BLOCKED';
            t.blockedOn = 'Waiting for forks';
          }
        } else if (state === 'eating' && Math.random() > 0.5) {
          nf[l] = true;
          nf[r] = true;
          ns[i] = 'thinking';
          t.action = 'Thinking';
          t.blockedOn = null;
        }

        return ns;
      });
      return nf;
    });
  };

  const readerWork = (t) => {
    if (writer === null) {
      setReaders(r => r + 1);
      t.action = 'Reading';
      setTimeout(() => setReaders(r => Math.max(0, r - 1)), 1500);
    } else {
      t.state = 'BLOCKED';
      t.blockedOn = 'Writer active';
    }
  };

  const writerWork = (t) => {
    if (readers === 0 && writer === null) {
      setWriter(t.id);
      t.action = 'Writing';
      setTimeout(() => setWriter(null), 2000);
    } else {
      t.state = 'BLOCKED';
      t.blockedOn = readers > 0 ? 'Readers active' : 'Writer active';
    }
  };

  const checkDeadlock = () => {
    const allBlocked = threads.filter(t => t.type === 'philosopher').every(t => t.state === 'BLOCKED');
    const allForksHeld = forks.every(f => !f);
    if (allBlocked && allForksHeld && threads.length > 0) {
      if (!deadlock) {
        setDeadlock(true);
        addLog('DEADLOCK DETECTED!');
      }
    } else if (deadlock) {
      setDeadlock(false);
    }
  };

  useEffect(() => {
    if (isRunning) {
      animRef.current = setInterval(step, speed);
    } else {
      if (animRef.current) clearInterval(animRef.current);
    }
    return () => animRef.current && clearInterval(animRef.current);
  }, [isRunning, threads, scenario, algorithm, quantum, speed]);

  const metrics = () => {
    const done = threads.filter(t => t.state === 'TERMINATED');
    if (!done.length) return { wt: '0.00', tat: '0.00', cpu: '0' };
    const wt = (done.reduce((s, t) => s + t.waiting, 0) / done.length).toFixed(2);
    const tat = (done.reduce((s, t) => s + (t.burst + t.waiting), 0) / done.length).toFixed(2);
    const cpu = Math.min(100, Math.round((gantt.length / (simTime.current || 1)) * 100));
    return { wt, tat, cpu };
  };

  const m = metrics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">ThreadViz Pro</h1>
            <p className="text-gray-400 mt-2">OS Concurrency & Scheduling Simulator - Team Apex</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Sim Time</p>
            <p className="text-3xl font-bold text-cyan-400">{simTime.current}</p>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users size={24} className="text-purple-400" />
            Concurrency Problems
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'pc', name: 'Producer-Consumer', icon: Database },
              { id: 'phil', name: 'Dining Philosophers', icon: Utensils },
              { id: 'rw', name: 'Readers-Writers', icon: Book }
            ].map(s => (
              <button key={s.id} onClick={() => initScenario(s.id)} className={`p-4 rounded-lg flex items-center gap-3 ${scenario === s.id ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
                <s.icon size={24} />
                <span className="font-semibold">{s.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Cpu size={24} className="text-cyan-400" />
            CPU Scheduling (Independent)
          </h2>
          <div className="grid grid-cols-5 gap-3 mb-4">
            {Object.entries(ALGORITHMS).map(([k, v]) => (
              <button key={k} onClick={() => setAlgorithm(k)} className={`p-3 rounded-lg ${algorithm === k ? 'bg-gradient-to-br from-cyan-500 to-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
                <p className="font-semibold text-sm">{k}</p>
                <p className="text-xs text-gray-300 mt-1">{v}</p>
              </button>
            ))}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            {algorithm === 'RR' && (
              <div className="flex items-center gap-4 bg-slate-700/50 rounded-lg p-3">
                <Clock size={18} className="text-yellow-400" />
                <label className="text-sm">Quantum:</label>
                <input type="number" min="1" max="10" value={quantum} onChange={(e) => setQuantum(Number(e.target.value))} className="w-20 px-3 py-1 bg-slate-800 rounded border border-slate-600" />
                <span className="text-sm text-gray-400">{currentQ}/{quantum}</span>
              </div>
            )}
            
            <div className="flex items-center gap-4 bg-slate-700/50 rounded-lg p-3">
              <Activity size={18} className="text-green-400" />
              <label className="text-sm">Speed:</label>
              <input type="range" min="200" max="2000" step="200" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="flex-1" />
              <span className="text-sm text-gray-400">{((2000 - speed) / 200).toFixed(1)}x</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
              <p className="text-xs text-gray-400">Avg Wait Time</p>
              <p className="text-2xl font-bold text-blue-400">{m.wt}</p>
            </div>
            <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-3">
              <p className="text-xs text-gray-400">Avg Turnaround</p>
              <p className="text-2xl font-bold text-purple-400">{m.tat}</p>
            </div>
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
              <p className="text-xs text-gray-400">CPU Utilization</p>
              <p className="text-2xl font-bold text-green-400">{m.cpu}%</p>
            </div>
          </div>
        </div>

        {gantt.length > 0 && (
          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BarChart3 size={24} className="text-pink-400" />
              Gantt Chart
            </h2>
            <div className="overflow-x-auto pb-8">
              <div className="flex gap-1 min-w-max">
                {gantt.map((g, i) => (
                  <div key={i} className={`${g.color} h-12 px-2 flex items-center justify-center text-xs font-bold relative ${i === 0 || gantt[i-1].id !== g.id ? 'border-l-2 border-white' : ''}`} style={{ minWidth: '40px' }}>
                    {(i === 0 || gantt[i-1].id !== g.id) && g.name.charAt(0)}
                    <span className="absolute -bottom-5 left-0 text-gray-400 text-xs">{g.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
          <div className="flex gap-3">
            <button onClick={() => setIsRunning(!isRunning)} disabled={!scenario} className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 ${!scenario ? 'bg-gray-600' : isRunning ? 'bg-orange-500' : 'bg-green-500'}`}>
              {isRunning ? <><Pause size={20} />Pause</> : <><Play size={20} />Start</>}
            </button>
            <button onClick={() => { setIsRunning(false); if (scenario) initScenario(scenario); }} className="px-6 py-3 bg-red-500 rounded-lg font-semibold flex items-center gap-2">
              <RotateCcw size={20} />Reset
            </button>
            <button onClick={() => {
              if (!scenario) return;
              const types = scenario === 'pc' ? ['producer', 'consumer'] : scenario === 'phil' ? ['philosopher'] : ['reader', 'writer'];
              const type = types[Math.floor(Math.random() * types.length)];
              const count = threads.filter(t => t.type === type).length;
              setThreads(p => [...p, createThread(type, `${type} ${count + 1}`, count)]);
            }} disabled={!scenario} className="px-6 py-3 bg-blue-500 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50">
              <Plus size={20} />Add
            </button>
          </div>
        </div>

        {deadlock && (
          <div className="bg-red-500/20 border-2 border-red-500 rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <AlertCircle size={24} className="text-red-400" />
              <p className="font-bold text-red-400">DEADLOCK DETECTED!</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Activity className="text-blue-400" />
              Threads ({threads.length})
            </h2>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {threads.map(t => (
                <div key={t.id} className={`${t.color} bg-opacity-10 rounded-lg p-4 border-2 ${t.color.replace('bg-', 'border-')}`}>
                  <div className="flex justify-between mb-2">
                    <div>
                      <p className="font-bold">{t.name}</p>
                      <p className="text-xs text-gray-300">P:{t.priority} B:{t.burst} A:{t.arrivalTime}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${THREAD_STATES[t.state].color}`}>{THREAD_STATES[t.state].label}</span>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>{t.burst - t.remaining}/{t.burst}</span>
                      <span>{t.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2">
                      <div className={`${t.color} h-2 rounded-full`} style={{ width: `${t.progress}%` }}></div>
                    </div>
                  </div>
                  {t.action && <p className="text-sm text-gray-300">{t.action}</p>}
                  <p className="text-xs text-gray-400">W:{t.waiting} R:{t.remaining}</p>
                  {t.blockedOn && <div className="mt-2 bg-red-500/20 border border-red-500/30 rounded p-2 text-sm text-red-300">{t.blockedOn}</div>}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {scenario === 'pc' && (
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Buffer</h2>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-400">Size:</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={bufferSize}
                      onChange={(e) => handleBufferSizeChange(Number(e.target.value))}
                      className="w-14 px-2 py-1 bg-slate-900 rounded border border-slate-600 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {buffer.map((item, i) => (
                    <div key={i} className={`aspect-square rounded-lg border-2 flex items-center justify-center ${item ? `${item.color} bg-opacity-20 border-green-500` : 'bg-slate-700/50 border-slate-600'}`}>
                      {item ? <p className="text-2xl font-bold">{item.val}</p> : <span className="text-gray-500 text-2xl">·</span>}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-700/50 rounded p-3">
                    <p className="text-xs text-gray-400">Empty</p>
                    <p className="text-xl font-bold text-blue-400">{semaphores.empty}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded p-3">
                    <p className="text-xs text-gray-400">Full</p>
                    <p className="text-xl font-bold text-green-400">{semaphores.full}</p>
                  </div>
                </div>
              </div>
            )}

            {scenario === 'phil' && (
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h2 className="text-xl font-bold mb-4">Table</h2>
                <div className="relative w-full aspect-square max-w-sm mx-auto">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-900/30 to-amber-700/30 border-4 border-amber-600/50"></div>
                  {threads.map((t, i) => {
                    const angle = (i * 360 / threads.length) - 90;
                    const r = 45;
                    const x = 50 + r * Math.cos(angle * Math.PI / 180);
                    const y = 50 + r * Math.sin(angle * Math.PI / 180);
                    return (
                      <div key={t.id} className={`absolute w-12 h-12 rounded-full border-4 flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 ${philStates[i] === 'eating' ? 'bg-green-500 border-green-400' : philStates[i] === 'hungry' ? 'bg-yellow-500 border-yellow-400' : 'bg-purple-500 border-purple-400'}`} style={{ left: `${x}%`, top: `${y}%` }}>
                        <span className="text-lg font-bold">{i + 1}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {scenario === 'rw' && (
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h2 className="text-xl font-bold mb-4">Resource</h2>
                <div className="bg-slate-900 rounded-lg p-8 border-2 border-slate-600 text-center">
                  {writer ? (
                    <><Database size={48} className="text-red-400 mx-auto mb-3" />
                    <p className="text-xl font-bold text-red-400">WRITER ACTIVE</p></>
                  ) : readers > 0 ? (
                    <><Database size={48} className="text-green-400 mx-auto mb-3" />
                    <p className="text-xl font-bold text-green-400">{readers} READERS</p></>
                  ) : (
                    <><Database size={48} className="text-gray-400 mx-auto mb-3" />
                    <p className="text-xl font-bold text-gray-400">IDLE</p></>
                  )}
                </div>
              </div>
            )}

            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Info className="text-green-400" />
                Logs
              </h2>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {logs.map(l => (
                  <div key={l.id} className="bg-slate-700/30 rounded p-2 text-sm">
                    <span className="text-gray-400 text-xs">{l.time}</span>
                    <p className="text-gray-200">{l.msg}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreadViz;