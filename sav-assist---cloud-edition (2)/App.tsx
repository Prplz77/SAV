
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { NewCallView } from './components/NewCallView';
import { HistoryView } from './components/HistoryView';
import { StatsView } from './components/StatsView';
import { CallLog, View } from './types';

const STORAGE_KEY = 'sav_assist_cloud_v1';
const TECH_KEY = 'sav_assist_active_tech';

const App: React.FC = () => {
  const [view, setView] = useState<View>('new-call');
  const [history, setHistory] = useState<CallLog[]>([]);
  const [technician, setTechnician] = useState<string>(localStorage.getItem(TECH_KEY) || '');

  // Chargement initial
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Erreur chargement local", e);
      }
    }
  }, []);

  // Persistance locale automatique
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(TECH_KEY, technician);
  }, [technician]);

  const handleSaveCall = (log: CallLog) => {
    const logWithTech = { ...log, technicianName: technician || 'Expert Anonyme' };
    setHistory(prev => [logWithTech, ...prev]);
    setView('history');
  };

  const handleDeleteCall = (id: string) => {
    if (confirm('Supprimer définitivement cet appel de votre historique ?')) {
      setHistory(prev => prev.filter(log => log.id !== id));
    }
  };

  const generateSyncCode = () => {
    if (history.length === 0) {
      alert("Aucun appel à partager.");
      return;
    }
    const dataStr = JSON.stringify(history);
    const syncCode = btoa(dataStr);
    navigator.clipboard.writeText(syncCode);
    alert("Code de synchronisation d'équipe copié ! Envoyez-le à vos collègues.");
  };

  const importSharedData = (content: string) => {
    try {
      const imported = JSON.parse(content);
      if (Array.isArray(imported)) {
        setHistory(prev => {
          // Fusion intelligente : on ne garde que les IDs uniques
          const existingIds = new Set(prev.map(p => p.id));
          const newEntries = imported.filter(h => !existingIds.has(h.id));
          return [...newEntries, ...prev];
        });
      }
    } catch (e) {
      alert("Données corrompues.");
    }
  };

  return (
    <Layout 
      currentView={view} 
      setView={setView} 
      onExport={generateSyncCode}
      onImport={importSharedData}
      technician={technician}
      setTechnician={setTechnician}
    >
      {view === 'new-call' && (
        <NewCallView onSave={handleSaveCall} />
      )}
      {view === 'history' && (
        <HistoryView history={history} onDelete={handleDeleteCall} />
      )}
      {view === 'stats' && (
        <StatsView history={history} />
      )}
    </Layout>
  );
};

export default App;
