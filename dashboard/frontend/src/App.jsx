import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import ProjectsPage from './pages/ProjectsPage';
import GeneratePage from './pages/GeneratePage';
import RunsPage from './pages/RunsPage';
import ConfigPage from './pages/ConfigPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-slate-900 text-slate-100 font-sans">
        <aside className="w-64 bg-slate-800/80 backdrop-blur-md border-r border-slate-700 flex flex-col shadow-xl z-10">
          <div className="m-8">
            <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">QA Automation<br/>Framework</h2>
          </div>
          <nav className="flex flex-col mt-4">
            <NavLink to="/projects" className={({isActive}) => `px-8 py-3 text-sm font-medium transition-all border-l-4 ${isActive ? "border-blue-500 bg-blue-500/10 text-white shadow-inner" : "border-transparent text-slate-400 hover:bg-white/5 hover:text-white"}`}>
              Projects Workflow
            </NavLink>
            <NavLink to="/generate" className={({isActive}) => `px-8 py-3 text-sm font-medium transition-all border-l-4 ${isActive ? "border-blue-500 bg-blue-500/10 text-white shadow-inner" : "border-transparent text-slate-400 hover:bg-white/5 hover:text-white"}`}>
              Spec Generator
            </NavLink>
            <NavLink to="/runs" className={({isActive}) => `px-8 py-3 text-sm font-medium transition-all border-l-4 ${isActive ? "border-blue-500 bg-blue-500/10 text-white shadow-inner" : "border-transparent text-slate-400 hover:bg-white/5 hover:text-white"}`}>
              Test Runner
            </NavLink>
            <NavLink to="/config" className={({isActive}) => `px-8 py-3 text-sm font-medium transition-all border-l-4 ${isActive ? "border-blue-500 bg-blue-500/10 text-white shadow-inner" : "border-transparent text-slate-400 hover:bg-white/5 hover:text-white"}`}>
              Configuration Settings
            </NavLink>
          </nav>
        </aside>
        
        <main className="flex-1 p-10 overflow-y-auto bg-slate-900/50">
          <div className="max-w-6xl mx-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/projects" replace />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/generate" element={<GeneratePage />} />
              <Route path="/runs" element={<RunsPage />} />
              <Route path="/config" element={<ConfigPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
