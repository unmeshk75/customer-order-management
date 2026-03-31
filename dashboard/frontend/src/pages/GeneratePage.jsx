import { useState } from 'react';
import api, { streamJob } from '../api';

export default function GeneratePage() {
  const [logs, setLogs] = useState([]);
  const [jobId, setJobId] = useState(null);

  const startGen = async () => {
    try {
      const res = await api.post('/generation/e2e', { project_id: 1, provider: 'anthropic' });
      setJobId(res.data.job_id);
      setLogs([]);
      streamJob(res.data.job_id, (l) => setLogs(old => [...old, l]), (d) => {
        setLogs(old => [...old, `\n[SYSTEM] DONE. Status: ${d.status}`]);
      });
    } catch (e) { alert("Please link a folder in Projects first (ID 1 needed)."); }
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-center bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
        <div>
          <h1 className="text-3xl font-bold text-white">Spec Generator</h1>
          <p className="text-slate-400 mt-1">Generate Playwright E2E structural definitions</p>
        </div>
        <button 
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg border border-indigo-500 shadow-lg shadow-indigo-500/20 transition-all font-semibold"
          onClick={startGen}
        >
          Initialize Generator Job
        </button>
      </div>
      
      <div className="flex-1 bg-black border border-slate-700 rounded-xl overflow-hidden shadow-2xl flex flex-col">
        <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-xs font-mono text-slate-400">generator/stream.log</span>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto font-mono text-sm leading-relaxed" style={{ color: '#4ade80' }}>
          {logs.length === 0 ? (
             <span className="text-slate-600">Awaiting job execution... Click the button above to start.</span>
          ) : (
            logs.map((l, i) => (
               <div key={i} className="mb-1 whitespace-pre-wrap break-words">{l}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
