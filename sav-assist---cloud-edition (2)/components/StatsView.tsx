
import React, { useMemo } from 'react';
import { CallLog } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, Users, PhoneCall, Smile } from 'lucide-react';

interface StatsViewProps {
  history: CallLog[];
}

export const StatsView: React.FC<StatsViewProps> = ({ history }) => {
  const sentimentData = useMemo(() => {
    const counts = { positive: 0, neutral: 0, negative: 0 };
    history.forEach(log => {
      counts[log.summary.sentiment]++;
    });
    return [
      { name: 'Positif', value: counts.positive, color: '#10b981' },
      { name: 'Neutre', value: counts.neutral, color: '#94a3b8' },
      { name: 'Négatif', value: counts.negative, color: '#ef4444' },
    ];
  }, [history]);

  const activityData = useMemo(() => {
    // Group by last 7 days
    const days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return {
        date: d.toLocaleDateString('fr-FR', { weekday: 'short' }),
        count: 0,
        rawDate: d.toDateString()
      };
    }).reverse();

    history.forEach(log => {
      const logDate = new Date(log.timestamp).toDateString();
      const day = days.find(d => d.rawDate === logDate);
      if (day) day.count++;
    });

    return days;
  }, [history]);

  const totalCalls = history.length;
  const uniqueCustomers = new Set(history.map(h => h.phoneNumber)).size;
  const happyPercent = totalCalls > 0 ? Math.round((sentimentData[0].value / totalCalls) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h2 className="text-3xl font-bold text-slate-900">Tableau de Bord</h2>
        <p className="text-slate-500">Aperçu de la performance du service après-vente.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<PhoneCall className="text-blue-600" />} label="Total Appels" value={totalCalls} color="bg-blue-50" />
        <StatCard icon={<Users className="text-emerald-600" />} label="Clients Uniques" value={uniqueCustomers} color="bg-emerald-50" />
        <StatCard icon={<Smile className="text-amber-600" />} label="Satisfaction" value={`${happyPercent}%`} color="bg-amber-50" />
        <StatCard icon={<TrendingUp className="text-indigo-600" />} label="Appels / Jour" value={(totalCalls / Math.max(1, activityData.length)).toFixed(1)} color="bg-indigo-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold mb-6 text-slate-800">Activité des 7 derniers jours</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold mb-6 text-slate-800">Répartition des sentiments</h3>
          <div className="h-64 flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 ml-4">
              {sentimentData.map(s => (
                <div key={s.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: s.color}}></div>
                  <span className="text-sm font-medium text-slate-600">{s.name}: {s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className={`p-3 rounded-xl ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
);
