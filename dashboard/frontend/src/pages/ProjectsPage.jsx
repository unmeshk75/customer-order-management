import { useState, useEffect } from 'react';
import api from '../api';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  
  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (e) { console.error(e); }
  };

  const createDummy = async () => {
    try {
      await api.post('/projects/link', { name: 'Main Frontend Project', path: 'd:/order-management/frontend', src_subdir: 'src' });
      loadProjects();
    } catch (e) { alert("Invalid path: " + (e.response?.data?.detail || e.message)); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
        <div>
          <h1 className="text-3xl font-bold text-white">Projects</h1>
          <p className="text-slate-400 mt-1">Manage local workspace configurations</p>
        </div>
        <button 
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg border border-blue-500 shadow-lg shadow-blue-500/20 transition-all font-semibold"
          onClick={createDummy}
        >
          + Link Local Folder
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 ? (
           <div className="col-span-full py-12 text-center text-slate-500 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
             No projects linked yet. Click "Link Local Folder" to begin.
           </div>
        ) : null}

        {projects.map(p => (
          <div key={p.id} className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 transition-all group">
            <h3 className="text-xl font-bold text-slate-100 group-hover:text-blue-400 transition-colors">{p.name}</h3>
            <p className="text-sm font-mono text-slate-400 mt-2 truncate" title={p.source_path}>{p.source_path}</p>
            
            <div className="mt-4 flex gap-2">
              <span className="px-2.5 py-1 bg-slate-900 border border-slate-700 text-slate-300 rounded-md text-xs font-semibold tracking-wide uppercase">
                {p.status}
              </span>
              <span className="px-2.5 py-1 bg-blue-900/30 border border-blue-800 text-blue-300 rounded-md text-xs font-semibold tracking-wide uppercase">
                {p.source_type}
              </span>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-700 flex justify-end">
              <button 
                className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors border border-red-500/20 hover:border-red-500"
                onClick={async () => { await api.delete(`/projects/${p.id}`); loadProjects(); }}
              >
                Delete Map
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
