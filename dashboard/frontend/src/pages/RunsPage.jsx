import { useState } from 'react';
import api, { streamRun } from '../api';

export default function RunsPage() {
  const [logs, setLogs] = useState([]);
  
  const startRun = async () => {
    try {
      const res = await api.post('/runs', { project_id: 1 });
      setLogs([]);
      streamRun(res.data.run_id, (l) => setLogs(old => [...old, l]), (d) => {
        setLogs(old => [...old, `\n[SYSTEM] RUN FINISHED. Status: ${d.status}`]);
      });
    } catch (e) { alert("Please link a folder in Projects first (ID 1 needed)."); }
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-center bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
        <div>
          <h1 className="text-3xl font-bold text-white">Test Runner</h1>
          <p className="text-slate-400 mt-1">Execute Playwright assertions and watch results</p>
        </div>
        <button 
          className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-6 py-2.5 rounded-lg border border-fuchsia-500 shadow-lg shadow-fuchsia-500/20 transition-all font-semibold"
          onClick={startRun}
        >
          Execute Playwright Suite
        </button>
      </div>
      
      <div className="flex-1 bg-slate-950 border border-slate-700 rounded-xl overflow-hidden shadow-2xl flex flex-col">
        <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center justify-between">
          <div className="flex gap-1.5 items-center">
            <div className="w-3 h-3 rounded-full bg-slate-600"></div>
            <div className="w-3 h-3 rounded-full bg-slate-600"></div>
            <div className="w-3 h-3 rounded-full bg-slate-600"></div>
            <span className="ml-3 text-xs font-mono text-slate-400">Playwright Terminal Output</span>
          </div>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto font-mono text-sm leading-relaxed" style={{ color: '#c0caf5' }}>
          {logs.length === 0 ? (
            <span className="text-slate-600">Terminal ready. Initialize test run above.</span>
          ) : (
            logs.map((l, i) => (
              <div key={i} className={`mb-1 whitespace-pre-wrap break-words ${l.includes('failed') ? 'text-red-400' : ''}`}>{l}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
