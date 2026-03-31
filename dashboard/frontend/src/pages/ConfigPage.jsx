import { useState, useEffect } from 'react';
import api from '../api';

export default function ConfigPage() {
  const [configs, setConfigs] = useState([]);

  useEffect(() => { loadConfig(); }, []);

  const loadConfig = async () => {
    try {
      const res = await api.get('/config');
      setConfigs(res.data);
    } catch (e) { console.error(e); }
  };

  const saveAll = async () => {
    try {
      await api.post('/config/bulk', configs);
      alert('Saved configuration!');
    } catch (e) { alert('Failed to save.'); }
  };

  const updateConfig = (key, val) => {
    setConfigs(configs.map(c => c.key === key ? { ...c, value: val } : c));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
        <div>
          <h1 className="text-3xl font-bold text-white">Global Configuration</h1>
          <p className="text-slate-400 mt-1">Manage API Keys and Environment Variables</p>
        </div>
        <button 
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg border border-emerald-500 shadow-lg shadow-emerald-500/20 transition-all font-semibold"
          onClick={saveAll}
        >
          Save All Changes
        </button>
      </div>

      <div className="grid gap-6 max-w-4xl">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-sm">
          <div className="grid gap-5">
            {configs.map(c => (
              <div key={c.id} className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-slate-300">
                  {c.key} 
                  {c.is_secret === 1 && (
                    <span className="ml-2 text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-500/30 uppercase tracking-wider font-bold">Secret</span>
                  )}
                </label>
                <div className="relative">
                  <input 
                    type={c.is_secret === 1 && c.value === '***' ? 'password' : 'text'} 
                    value={c.value} 
                    onChange={e => updateConfig(c.key, e.target.value)} 
                    placeholder={`Enter ${c.key}...`}
                    className="w-full bg-slate-900 text-slate-100 border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow placeholder:text-slate-600 font-mono text-sm"
                  />
                </div>
                {c.description && <p className="text-xs text-slate-500">{c.description}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
