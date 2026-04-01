import { useState, useEffect } from 'react';
import api, { streamRun } from '../api';

export default function RunsPage() {
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState('');
  const [testcases, setTestcases] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeRunId, setActiveRunId] = useState(null);

  useEffect(() => {
    api.get('/projects').then(res => {
      setProjects(res.data);
      if (res.data.length > 0) setActiveProjectId(res.data[0].id);
    }).catch(e => console.error(e));
  }, []);

  useEffect(() => {
    if (!activeProjectId) return;
    api.get(`/projects/${activeProjectId}/testcases`).then(res => {
      setTestcases(res.data);
    }).catch(e => console.error(e));
  }, [activeProjectId]);

  const startRun = async (specFile = '') => {
    if (!activeProjectId) return alert("Select a project first!");
    setIsRunning(true);
    setLogs([`INITIALIZING ${specFile ? `EXECUTION: ${specFile}` : 'BATCH SUITE'}`]);

    try {
      // Build spec_filter correctly relative to project workspace
      const payload = { project_id: parseInt(activeProjectId) };
      if (specFile) payload.spec_filter = `tests/${specFile}`;

      const res = await api.post('/runs', payload);
      setActiveRunId(res.data.run_id);
      streamRun(res.data.run_id, (l) => setLogs(old => [...old, l]), (d) => {
        setLogs(old => [...old, `\n[SYSTEM] RUN FINISHED. Status: ${d.status}`]);
        setIsRunning(false);
        setActiveRunId(null);
      });
    } catch (e) { 
      setIsRunning(false);
      setActiveRunId(null);
      alert("Execution failed to start: " + e.message); 
    }
  };

  const haltRun = async () => {
    if (!activeRunId) return;
    try {
      await api.post(`/runs/${activeRunId}/cancel`);
    } catch(e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
        <div>
          <h1 className="text-3xl font-bold text-white">QA Automation Framework Test Runner</h1>
          <p className="text-slate-400 mt-1">Execute Playwright assertions and watch results</p>
        </div>
      </div>

      <div className="flex gap-6 h-full min-h-0">
        {/* Left Sidebar: Controls & List */}
        <div className="w-1/3 flex flex-col gap-4">
          <div className="bg-slate-800 p-4 border border-slate-700 rounded-xl">
             <label className="block text-sm font-medium text-slate-300 mb-2">Target Project</label>
             <select 
               value={activeProjectId} 
               onChange={e => setActiveProjectId(e.target.value)}
               className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-lg text-white"
             >
               <option value="" disabled>Select a tracked project...</option>
               {projects.map(p => (
                 <option key={p.id} value={p.id}>{p.name}</option>
               ))}
             </select>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl flex-1 overflow-hidden flex flex-col">
             <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/80">
                <h3 className="font-semibold text-slate-200">Suite Cases ({testcases.length})</h3>
                <button 
                  disabled={isRunning || testcases.length === 0}
                  onClick={() => startRun('')}
                  className="bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 disabled:hover:bg-fuchsia-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                  Run All Batch
                </button>
             </div>
             <div className="overflow-y-auto p-2">
                {testcases.length === 0 ? (
                  <p className="text-sm text-slate-500 p-4 text-center">No nested .spec.js files found in /tests folder.</p>
                ) : (
                  <ul className="space-y-1">
                    {testcases.map(tc => (
                      <li key={tc.file} className={`flex justify-between items-center p-2 rounded group text-sm transition-colors ${tc.status === 'passed' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'hover:bg-slate-700/50'}`}>
                        <span className="text-slate-300 font-mono truncate mr-2" title={tc.file}>{tc.file}</span>
                        <div className="flex gap-2 items-center">
                          {tc.status === 'passed' && <span className="text-[10px] text-emerald-400 font-semibold px-1 rounded uppercase tracking-wider">PASSED</span>}
                          {tc.status === 'failed' && <span className="text-[10px] text-red-400 font-semibold px-1 rounded uppercase tracking-wider">FAILED</span>}
                          {tc.status === 'halted' && <span className="text-[10px] text-orange-400 font-semibold px-1 rounded uppercase tracking-wider">HALTED</span>}
                          <button
                            disabled={isRunning}
                            onClick={() => startRun(tc.file)}
                            className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white px-2.5 py-1 rounded text-xs transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-0"
                          >
                            Run
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
             </div>
          </div>
        </div>

        {/* Right Pane: Terminal Output */}
        <div className="flex-1 bg-slate-950 border border-slate-700 rounded-xl overflow-hidden shadow-2xl flex flex-col">
          <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center justify-between">
            <div className="flex gap-1.5 items-center">
              <div className="w-3 h-3 rounded-full bg-slate-600"></div>
              <div className="w-3 h-3 rounded-full bg-slate-600"></div>
              <div className="w-3 h-3 rounded-full bg-slate-600"></div>
              <span className="ml-3 text-xs font-mono text-slate-400">Playwright Terminal Output</span>
            </div>
            <div className="flex items-center gap-4">
              {isRunning && (
                <>
                  <span className="text-xs text-fuchsia-400 animate-pulse font-mono">EXECUTING...</span>
                  <button onClick={haltRun} className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white px-3 py-1 rounded text-xs font-semibold transition-colors">
                    HALT EXECUTION
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto font-mono text-sm leading-relaxed" style={{ color: '#c0caf5' }}>
            {logs.length === 0 ? (
              <span className="text-slate-600">Terminal ready. Initialize test run natively from suite blocks.</span>
            ) : (
              logs.map((l, i) => (
                <div key={i} className={`mb-1 whitespace-pre-wrap break-words ${l.includes('failed') ? 'text-red-400' : ''}`}>{l}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
