
import React, { useRef, useState } from 'react';
import { View } from '../types';
import { 
  PhoneCall, History, LayoutDashboard, Headset, 
  Share2, UserCircle, Zap, Globe, Github, ExternalLink, Copy, Check
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: View;
  setView: (view: View) => void;
  onExport: () => void;
  onImport: (data: string) => void;
  technician: string;
  setTechnician: (name: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, currentView, setView, onExport, onImport, technician, setTechnician 
}) => {
  const [showSync, setShowSync] = useState(false);
  const [showGithubGuide, setShowGithubGuide] = useState(false);
  const [tempCode, setTempCode] = useState('');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const handleSync = () => {
    try {
      const decoded = atob(tempCode);
      onImport(decoded);
      setTempCode('');
      setShowSync(false);
      alert("Base de données synchronisée !");
    } catch (e) {
      alert("Code invalide.");
    }
  };

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f1f5f9]">
      <nav className="w-full md:w-80 bg-slate-900 text-white p-8 flex flex-col sticky top-0 md:h-screen shadow-2xl z-50">
        <div className="flex items-center gap-4 mb-10">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20">
            <Headset size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight leading-none uppercase">SAV ASSIST</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Connecté Cloud</p>
            </div>
          </div>
        </div>

        <div className="mb-8 p-5 bg-slate-800/40 rounded-2xl border border-white/5">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Technicien</label>
          <div className="relative">
            <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              value={technician}
              onChange={(e) => setTechnician(e.target.value)}
              placeholder="Nom..."
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 flex-grow">
          <button onClick={() => setView('new-call')} className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${currentView === 'new-call' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800'}`}><PhoneCall size={20} /><span className="font-bold">Nouvel Appel</span></button>
          <button onClick={() => setView('history')} className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${currentView === 'history' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800'}`}><History size={20} /><span className="font-bold">Historique</span></button>
          <button onClick={() => setView('stats')} className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${currentView === 'stats' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800'}`}><LayoutDashboard size={20} /><span className="font-bold">Stats</span></button>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-800 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={onExport} className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 group">
              <Zap size={16} className="text-emerald-400 group-hover:scale-110" />
              <span className="text-[9px] font-bold">Code Partage</span>
            </button>
            <button onClick={() => setShowGithubGuide(true)} className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 group">
              <Github size={16} className="text-white group-hover:scale-110" />
              <span className="text-[9px] font-bold">Aide Mise en Ligne</span>
            </button>
          </div>
          <button onClick={() => setShowSync(true)} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold"><Globe size={14} className="text-blue-400" />Importer Données</button>
        </div>
      </nav>

      <main className="flex-grow p-6 md:p-12 overflow-y-auto h-screen"><div className="max-w-[1500px] mx-auto">{children}</div></main>

      {showGithubGuide && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4"><Github size={32} className="text-slate-900"/><h3 className="text-2xl font-black text-slate-900">Mise en ligne (Zéro Code)</h3></div>
              <button onClick={() => setShowGithubGuide(false)} className="text-slate-400 hover:text-slate-900">✕ Fermer</button>
            </div>
            
            <div className="space-y-6">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="font-bold text-slate-800 mb-4">1. Sur ton ordinateur :</p>
                <p className="text-sm text-slate-600">Assure-toi d'avoir bien créé tous les fichiers (même <b>package.json</b> et <b>vite.config.ts</b>).</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="font-bold text-slate-800 mb-4">2. Sur GitHub :</p>
                <p className="text-sm text-slate-600 mb-2">Crée un dépôt vide, puis utilise l'option <b>"uploading an existing file"</b> pour glisser tous tes fichiers.</p>
                <p className="text-[11px] bg-amber-50 text-amber-700 p-3 rounded-lg border border-amber-100">💡 Important : Ne pas oublier <b>package.json</b>, c'est lui qui débloque tout !</p>
              </div>
              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="font-bold text-blue-900 mb-4">3. Sur Vercel :</p>
                <p className="text-sm text-blue-800 mb-4">Importe ton projet GitHub. Avant de cliquer sur "Deploy", va dans <b>Environment Variables</b> :</p>
                <div className="flex flex-col gap-2">
                  <div className="bg-white p-3 rounded-lg border border-blue-200 text-xs font-mono"><b>Key :</b> API_KEY</div>
                  <div className="bg-white p-3 rounded-lg border border-blue-200 text-xs font-mono"><b>Value :</b> (Ta clé Google Gemini)</div>
                </div>
              </div>
              <button onClick={() => setShowGithubGuide(false)} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl">J'ai compris, je fonce !</button>
            </div>
          </div>
        </div>
      )}

      {showSync && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl">
            <h3 className="text-2xl font-black text-slate-900 mb-6">Coller un code de partage</h3>
            <textarea value={tempCode} onChange={(e) => setTempCode(e.target.value)} className="w-full h-40 p-4 bg-slate-50 border rounded-2xl mb-6 font-mono text-[10px]" placeholder="Code reçu d'un collègue..."/>
            <div className="flex gap-4">
              <button onClick={() => setShowSync(false)} className="flex-1 py-4 font-bold text-slate-500">Annuler</button>
              <button onClick={handleSync} className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg">Fusionner</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
