import { useState, useEffect } from 'react';
import api from '../api';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [linkData, setLinkData] = useState({ name: '', path: '', src_subdir: 'src' });
  
  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (e) { console.error(e); }
  };

  const handleLink = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects/link', linkData);
      setShowModal(false);
      loadProjects();
    } catch (e) { alert("Invalid inputs: " + (e.response?.data?.detail || e.message)); }
  };

  const handleBrowse = async () => {
    try {
      const res = await api.get('/projects/dialog');
      if (res.data.path) {
        setLinkData(prev => ({ ...prev, path: res.data.path }));
      }
    } catch (e) {
      alert("Failed to open dialog on backend machine.");
    }
  };

  const handleBrowseSrc = async () => {
    try {
      const res = await api.get('/projects/dialog');
      if (res.data.path) {
        // Just extract the relative part if possible, otherwise use absolute
        setLinkData(prev => ({ ...prev, src_subdir: res.data.path }));
      }
    } catch (e) {
      alert("Failed to open dialog.");
    }
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
          onClick={() => setShowModal(true)}
        >
          + Link Local Folder
        </button>
      </div>
      
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
           <form onSubmit={handleLink} className="bg-slate-800 p-8 rounded-xl border border-slate-700 w-full max-w-md shadow-2xl">
             <h2 className="text-xl font-bold mb-4">Link Project Folder</h2>
             <div className="space-y-4">
               <label className="block text-sm">Project Alias Name
                 <input required type="text" value={linkData.name} onChange={e=>setLinkData({...linkData, name: e.target.value})} className="mt-1 w-full bg-slate-900 border border-slate-700 p-2 rounded text-white" placeholder="e.g. My Website"/>
               </label>
               <label className="block text-sm">Absolute Folder Path
                 <div className="flex gap-2 mt-1">
                   <input required type="text" value={linkData.path} onChange={e=>setLinkData({...linkData, path: e.target.value})} className="flex-1 bg-slate-900 border border-slate-700 p-2 rounded text-white" placeholder="e.g. C:/Projects/App"/>
                   <button type="button" onClick={handleBrowse} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm text-slate-200 border border-slate-600">Browse...</button>
                 </div>
               </label>
               <label className="block text-sm">React SRC Subdir (Optional Native Path)
                 <div className="flex gap-2 mt-1">
                   <input type="text" value={linkData.src_subdir} onChange={e=>setLinkData({...linkData, src_subdir: e.target.value})} className="flex-1 bg-slate-900 border border-slate-700 p-2 rounded text-white" placeholder="e.g. src"/>
                   <button type="button" onClick={handleBrowseSrc} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm text-slate-200 border border-slate-600">Browse...</button>
                 </div>
               </label>
             </div>
             <div className="mt-6 flex justify-end gap-3">
               <button type="button" onClick={()=>setShowModal(false)} className="px-4 py-2 border border-slate-600 rounded text-slate-300">Cancel</button>
               <button type="submit" className="px-4 py-2 bg-blue-600 rounded text-white">Link Project</button>
             </div>
           </form>
        </div>
      )}

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
                E2E Context
              </span>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-700 flex justify-between items-center gap-2">
              <div className="text-xs text-slate-400 font-mono">
                 {p.manifest_path ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      Manifest Ready. Proceed to Generator
                    </span>
                 ) : (
                    <span className="text-amber-400/80">Pending Entity Scan...</span>
                 )}
              </div>
              
              <div className="flex gap-2">
                <button 
                  className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors border border-emerald-500/20 hover:border-emerald-500"
                  onClick={async () => { 
                      try {
                          await api.post(`/projects/${p.id}/extract-manifest`); 
                          alert('Manifest generated successfully! Proceeds to generate Locators and Pages.');
                          loadProjects(); 
                      } catch (e) { alert("Failed to extract: " + e.message); }
                  }}
                >
                  {p.manifest_path ? "Re-scan Entities" : "Scan Entities"}
                </button>
                <button 
                  className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors border border-red-500/20 hover:border-red-500"
                  onClick={async () => { await api.delete(`/projects/${p.id}`); loadProjects(); }}
                >
                  Delete Map
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
