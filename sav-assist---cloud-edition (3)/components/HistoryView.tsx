
import React, { useState, useMemo } from 'react';
import { CallLog } from '../types';
import { Search, Calendar, Phone, Trash2, ChevronRight, User, Ticket, HardHat } from 'lucide-react';

interface HistoryViewProps {
  history: CallLog[];
  onDelete: (id: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ history, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);

  const filteredHistory = useMemo(() => {
    return history.filter(log => 
      log.phoneNumber.includes(searchTerm) || 
      log.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.technicianName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.ticketNumber && log.ticketNumber.includes(searchTerm))
    ).sort((a, b) => b.timestamp - a.timestamp);
  }, [history, searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Historique Partagé</h2>
          <p className="text-slate-500 font-medium mt-1">Tous les diagnostics de l'équipe centralisés.</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher client, ticket ou technicien..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 shadow-sm"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className={`${selectedCall ? 'lg:col-span-5' : 'lg:col-span-12'} space-y-3 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar`}>
          {filteredHistory.length === 0 ? (
            <div className="bg-white border-2 border-slate-100 border-dashed rounded-[2rem] p-16 text-center">
              <p className="text-slate-400 font-black text-xl">Aucun diagnostic trouvé.</p>
            </div>
          ) : (
            filteredHistory.map(log => (
              <div
                key={log.id}
                onClick={() => setSelectedCall(log)}
                className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex items-center justify-between group ${
                  selectedCall?.id === log.id ? 'bg-blue-600 border-blue-600 shadow-xl shadow-blue-500/20 text-white' : 'bg-white border-slate-100 hover:border-blue-300 hover:shadow-lg shadow-slate-100/50'
                }`}
              >
                <div className="flex gap-5 items-center">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 font-black text-xl ${
                    selectedCall?.id === log.id ? 'bg-white/20 text-white' : 
                    log.summary.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-600' :
                    log.summary.sentiment === 'negative' ? 'bg-rose-100 text-rose-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {log.customerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-black text-lg flex items-center gap-3">
                      {log.customerName}
                      {log.ticketCreated && <span className={`text-[9px] px-2 py-0.5 rounded-lg font-black ${selectedCall?.id === log.id ? 'bg-white/20' : 'bg-blue-100 text-blue-700'}`}>TICKET</span>}
                    </h4>
                    <div className={`flex items-center gap-4 text-xs font-bold ${selectedCall?.id === log.id ? 'text-white/70' : 'text-slate-400'}`}>
                      <span className="flex items-center gap-1.5"><Phone size={12}/> {log.phoneNumber}</span>
                      <span className="flex items-center gap-1.5"><HardHat size={12}/> {log.technicianName}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight size={22} className={`transition-transform ${selectedCall?.id === log.id ? 'translate-x-1' : 'text-slate-200'}`} />
              </div>
            ))
          )}
        </div>

        {selectedCall && (
          <div className="lg:col-span-7 bg-white rounded-[3rem] border border-slate-100 p-12 shadow-2xl shadow-slate-200/50 sticky top-8 animate-in slide-in-from-right-8 duration-500">
            <div className="flex justify-between items-start mb-12">
              <div>
                <h3 className="text-4xl font-black text-slate-900 leading-tight mb-2">{selectedCall.summary.subject}</h3>
                <div className="flex items-center gap-4">
                   <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{new Date(selectedCall.timestamp).toLocaleString()}</span>
                   <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><HardHat size={12}/> Technicien : {selectedCall.technicianName}</span>
                </div>
              </div>
              <button onClick={() => onDelete(selectedCall.id)} className="p-4 text-slate-200 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"><Trash2 size={24}/></button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-12 pb-12 border-b border-slate-50">
              <div className="space-y-1.5"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</span><p className="font-black text-slate-800 text-lg">{selectedCall.customerName}</p></div>
              <div className="space-y-1.5"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Téléphone</span><p className="font-black text-slate-800 text-lg">{selectedCall.phoneNumber}</p></div>
              {selectedCall.ticketCreated && (
                <div className="space-y-1.5"><span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Référence Ticket</span><p className="font-black text-blue-600 text-lg">{selectedCall.ticketNumber}</p></div>
              )}
            </div>

            <div className="space-y-10">
              <section className="space-y-3"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Analyse Technique</h4><p className="text-slate-700 font-medium leading-relaxed bg-slate-50/50 p-6 rounded-3xl border border-slate-100 text-base">{selectedCall.summary.issue}</p></section>
              <section className="space-y-3"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tests Effectués</h4><p className="text-slate-700 font-medium leading-relaxed text-base">{selectedCall.summary.solution}</p></section>
              <section className="bg-blue-600 p-10 rounded-[2.5rem] shadow-2xl shadow-blue-500/20 text-white"><h4 className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-3">Décision Support</h4><p className="text-xl font-black leading-tight">{selectedCall.summary.nextSteps}</p></section>
              <section className="pt-8 border-t border-slate-100"><h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">Notes de dictée</h4><p className="text-slate-400 italic text-sm p-6 bg-slate-50 rounded-2xl">"{selectedCall.rawNotes}"</p></section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
