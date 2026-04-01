import { useState, useEffect } from 'react';
import api, { streamJob } from '../api';

export default function GeneratePage() {
  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    projectId: '',
    provider: 'anthropic',
    jobType: 'e2e', // 'e2e' or 'tests'
    onlyStep: '', // '', 'locators', 'pages'
    file: null
  });
  const [logs, setLogs] = useState([]);
  const [jobId, setJobId] = useState(null);

  useEffect(() => {
    api.get('/projects').then(res => {
      setProjects(res.data);
      if (res.data.length > 0) {
        setFormData(f => ({ ...f, projectId: res.data[0].id }));
      }
    });
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const startGen = async () => {
    if (!formData.projectId) return alert("Please link a project first.");
    
    setLogs([]);
    try {
      let res;
      if (formData.jobType === 'tests') {
        if (!formData.file) return alert("Please upload an Excel/CSV file with test cases.");
        const data = new FormData();
        data.append("project_id", formData.projectId);
        data.append("provider", formData.provider);
        data.append("file", formData.file);
        
        res = await api.post('/generation/tests', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        const payload = {
            project_id: parseInt(formData.projectId),
            provider: formData.provider
        };
        if (formData.onlyStep) payload.only_step = formData.onlyStep;
        res = await api.post('/generation/e2e', payload);
      }
      
      setJobId(res.data.job_id);
      streamJob(res.data.job_id, (l) => setLogs(old => [...old, l]), (d) => {
        setLogs(old => [...old, `\n[SYSTEM] DONE. Status: ${d.status}`]);
      });
    } catch (e) { alert("Generator failed: " + (e.response?.data?.detail || e.message)); }
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

      <div className="grid grid-cols-2 gap-6 bg-slate-800 border border-slate-700 p-6 rounded-xl">
        <label className="flex flex-col text-sm text-slate-300">Target Project
          <select name="projectId" value={formData.projectId} onChange={handleChange} className="mt-2 bg-slate-900 border border-slate-700 p-2 rounded">
             {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        
        <label className="flex flex-col text-sm text-slate-300">LLM Provider
          <select name="provider" value={formData.provider} onChange={handleChange} className="mt-2 bg-slate-900 border border-slate-700 p-2 rounded">
             <option value="anthropic">Anthropic (Claude)</option>
             <option value="gemini">Google Gemini</option>
             <option value="vertexai">Google Vertex AI</option>
             <option value="sdk">Claude SDK</option>
          </select>
        </label>

        <label className="flex flex-col text-sm text-slate-300">Generation Stage
          <select name="jobType" value={formData.jobType} onChange={handleChange} className="mt-2 bg-slate-900 border border-slate-700 p-2 rounded">
             <option value="e2e">E2E Scaffolding (Locators & Pages)</option>
             <option value="tests">Test Spec Cases</option>
          </select>
        </label>

        {formData.jobType === 'e2e' ? (
          <label className="flex flex-col text-sm text-slate-300">E2E Scope
            <select name="onlyStep" value={formData.onlyStep} onChange={handleChange} className="mt-2 bg-slate-900 border border-slate-700 p-2 rounded">
               <option value="">Full End-to-End</option>
               <option value="locators">Locators Only</option>
               <option value="pages">Pages Only</option>
            </select>
          </label>
        ) : (
          <label className="flex flex-col text-sm text-slate-300">Test Cases File (Excel/CSV)
             <input type="file" name="file" onChange={handleChange} className="mt-2 bg-slate-900 border border-slate-700 p-1.5 rounded text-sm"/>
          </label>
        )}
      </div>
      
      <div className="flex-1 bg-black border border-slate-700 rounded-xl overflow-hidden shadow-2xl flex flex-col min-h-[400px]">
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
