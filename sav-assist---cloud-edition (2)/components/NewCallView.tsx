import React, { useState, useRef, useEffect } from 'react';
import { summarizeCall, deepAnalyzeCall } from '../services/geminiService';
import { CallLog, CallSummary } from '../types';
import { 
  Loader2, Sparkles, Save, User, Phone, FileText, Mic, MicOff, 
  Settings2, Info, CheckCircle2, AlertTriangle, Building2, 
  Activity, Gauge, AudioWaveform as WaveIcon, Ticket, BrainCircuit, Copy, Check
} from 'lucide-react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { encode } from '../services/audioUtils';

interface NewCallViewProps {
  onSave: (log: CallLog) => void;
}

const GAINABLE_BRANDS = [
  "Atlantic", "Daikin", "Mitsubishi Electric", "Toshiba", 
  "Hitachi", "Panasonic", "LG", "Fujitsu", "Aldes", "Haier", "Midea", "Autre"
];

const PRODUCT_TYPES = [
  "Passerelle", "Centrale", "Thermostat", "Moteur", "Registre"
];

export const NewCallView: React.FC<NewCallViewProps> = ({ onSave }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [rawNotes, setRawNotes] = useState('');
  const [productType, setProductType] = useState('Passerelle');
  const [brand, setBrand] = useState('Atlantic');
  const [ticketCreated, setTicketCreated] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isDeepAnalyzing, setIsDeepAnalyzing] = useState(false);
  const [tempSummary, setTempSummary] = useState<CallSummary | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [lastTranscriptTime, setLastTranscriptTime] = useState(Date.now());
  const [audioQuality, setAudioQuality] = useState<{
    status: 'optimal' | 'bruyant' | 'faible' | 'hesitant';
    label: string;
    color: string;
    bgColor: string;
  }>({ status: 'optimal', label: 'Micro prêt', color: 'text-slate-400', bgColor: 'bg-slate-50' });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const silenceDuration = now - lastTranscriptTime;
      if (audioLevel > 65) {
        setAudioQuality({ status: 'bruyant', label: 'Bruit ambiant élevé', color: 'text-rose-600', bgColor: 'bg-rose-50' });
      } else if (audioLevel < 3 && silenceDuration > 2000) {
        setAudioQuality({ status: 'faible', label: 'Voix faible ?', color: 'text-amber-600', bgColor: 'bg-amber-50' });
      } else {
        setAudioQuality({ status: 'optimal', label: 'Transcription optimale', color: 'text-emerald-600', bgColor: 'bg-emerald-50' });
      }
    }, 800);
    return () => clearInterval(interval);
  }, [isRecording, audioLevel, lastTranscriptTime]);

  const handleSummarize = async (deep: boolean = false) => {
    if (!rawNotes.trim()) return;
    if (deep) setIsDeepAnalyzing(true); else setIsSummarizing(true);
    try {
      const summary = deep 
        ? await deepAnalyzeCall(rawNotes, { brand, productType })
        : await summarizeCall(rawNotes, { productType, brand, gatewayReplaced: false });
      setTempSummary(summary);
    } catch (error) {
      alert("Erreur lors de la génération.");
    } finally {
      setIsSummarizing(false);
      setIsDeepAnalyzing(false);
    }
  };

  const copyToClipboard = () => {
    if (!tempSummary) return;
    const text = `OBJET : ${tempSummary.subject}\nMATERIEL : ${brand} - ${productType}\nCLIENT : ${customerName} (${phoneNumber})\nTICKET : ${ticketCreated ? ticketNumber : 'N/A'}\n\nDIAGNOSTIC : ${tempSummary.issue}\nACTIONS : ${tempSummary.solution}\nDECISION : ${tempSummary.nextSteps}`;
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleSave = () => {
    if (!phoneNumber || !customerName || !tempSummary) {
      alert("Veuillez remplir les informations client.");
      return;
    }
    onSave({
      id: crypto.randomUUID(),
      phoneNumber,
      customerName,
      technicianName: '', // Sera remplacé par App.tsx
      timestamp: Date.now(),
      rawNotes,
      summary: tempSummary,
      ticketCreated,
      ticketNumber: ticketCreated ? ticketNumber : undefined
    });
    setPhoneNumber('');
    setCustomerName('');
    setRawNotes('');
    setTempSummary(null);
  };

  const startRecording = async () => {
    try {
      // Create a new GoogleGenAI instance right before making an API call for real-time safety.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      const sourceMic = audioContext.createMediaStreamSource(stream);
      sourceMic.connect(analyser);

      const updateLevel = () => {
        if (!analyserRef.current || !isRecording) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        setAudioLevel(dataArray.reduce((a, b) => a + b) / dataArray.length);
        if (isRecording) requestAnimationFrame(updateLevel);
      };

      const sessionPromise = ai.live.connect({
        // For real-time audio tasks, use the native audio preview model.
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsRecording(true);
            setLastTranscriptTime(Date.now());
            requestAnimationFrame(updateLevel);
            const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
            processorRef.current = scriptProcessor;
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
              // Critical: Initiate sendRealtimeInput after live.connect call resolves.
              if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then(s => s.sendRealtimeInput({ media: pcmBlob }));
              }
            };
            sourceMic.connect(scriptProcessor);
            scriptProcessor.connect(audioContext.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.inputTranscription) {
              const text = msg.serverContent.inputTranscription.text;
              if (text) {
                setLastTranscriptTime(Date.now());
                setRawNotes(prev => prev.trim() ? `${prev.trim()} ${text}` : text);
              }
            }
          },
          onerror: () => stopRecording(),
          onclose: () => setIsRecording(false)
        },
        config: { 
          responseModalities: [Modality.AUDIO], 
          inputAudioTranscription: {} 
        }
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (err) { alert('Microphone inaccessible.'); }
  };

  const stopRecording = () => {
    if (processorRef.current) processorRef.current.disconnect();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioContextRef.current) audioContextRef.current.close();
    if (sessionPromiseRef.current) sessionPromiseRef.current.then(s => s.close());
    setIsRecording(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Nouvel Appel SAV</h2>
        <p className="text-slate-500 font-medium mt-1">Remplissez les informations techniques et lancez l'IA.</p>
      </header>

      <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Building2 size={12}/> Marque</label>
          <select value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 text-slate-900 font-black focus:border-blue-500 outline-none transition-all">
            {GAINABLE_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Activity size={12}/> Produit</label>
          <select value={productType} onChange={(e) => setProductType(e.target.value)} className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 text-slate-900 font-black focus:border-blue-500 outline-none transition-all">
            {PRODUCT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="space-y-2 lg:col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Ticket size={12}/> Statut Ticket</label>
          <div className="flex gap-3 h-12">
            <button onClick={() => setTicketCreated(false)} className={`flex-1 rounded-xl font-black transition-all border-2 ${!ticketCreated ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>NON CRÉÉ</button>
            <button onClick={() => setTicketCreated(true)} className={`flex-1 rounded-xl font-black transition-all border-2 ${ticketCreated ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>CRÉÉ</button>
            {ticketCreated && (
              <input type="text" value={ticketNumber} onChange={(e) => setTicketNumber(e.target.value)} placeholder="N° Ticket..." className="flex-[2] px-4 rounded-xl border-2 border-blue-500 bg-blue-50 text-blue-900 font-black outline-none animate-in slide-in-from-left-4"/>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-8">
          <section className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2 group">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Client</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nom du client" className="w-full pl-14 pr-6 h-16 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none font-bold text-slate-900 bg-slate-50/50 transition-all"/>
                </div>
              </div>
              <div className="space-y-2 group">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Téléphone</label>
                <div className="relative">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                  <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="06..." className="w-full pl-14 pr-6 h-16 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none font-bold text-slate-900 bg-slate-50/50 transition-all"/>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-slate-900 text-lg flex items-center gap-3"><WaveIcon className="text-blue-600" size={20}/> Notes techniques</h4>
                <div className="flex items-center gap-3">
                  {isRecording && <div className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase ${audioQuality.bgColor} ${audioQuality.color} animate-pulse`}>{audioQuality.label}</div>}
                  <button onClick={isRecording ? stopRecording : startRecording} className={`flex items-center gap-3 px-6 py-3 rounded-xl font-black transition-all ${isRecording ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' : 'bg-slate-900 text-white hover:bg-black'}`}>
                    {isRecording ? <MicOff size={18}/> : <Mic size={18}/>} {isRecording ? 'Stop' : 'Dictée'}
                  </button>
                </div>
              </div>
              <textarea value={rawNotes} onChange={(e) => setRawNotes(e.target.value)} rows={10} placeholder="Décrivez les codes erreurs, tensions, et symptômes..." className="w-full p-8 rounded-[2rem] border-2 border-slate-100 focus:border-blue-500 outline-none font-medium text-slate-700 bg-slate-50/30 resize-none transition-all leading-relaxed"/>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button onClick={() => handleSummarize(false)} disabled={isSummarizing || isDeepAnalyzing || !rawNotes.trim()} className="py-6 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-900 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all">
                {isSummarizing ? <Loader2 className="animate-spin" size={24}/> : <Sparkles className="text-blue-600" size={24}/>} RÉSUMÉ FAST-AI
              </button>
              <button onClick={() => handleSummarize(true)} disabled={isSummarizing || isDeepAnalyzing || !rawNotes.trim()} className="py-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-500/20">
                {isDeepAnalyzing ? <Loader2 className="animate-spin" size={24}/> : <BrainCircuit size={24}/>} ANALYSE PRO
              </button>
            </div>
          </section>
        </div>

        <aside className="lg:col-span-5">
          <div className={`min-h-[500px] rounded-[3rem] border-2 transition-all p-10 flex flex-col sticky top-8 ${!tempSummary ? 'bg-slate-50 border-dashed border-slate-200 items-center justify-center text-center' : 'bg-white border-slate-100 shadow-2xl shadow-slate-200/50'}`}>
            {!tempSummary ? (
              <div className="space-y-6 max-w-[260px]">
                <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto border border-slate-50"><Gauge size={32} className="text-slate-200"/></div>
                <h4 className="text-slate-900 font-black text-xl">Analyseur SAV</h4>
                <p className="text-sm text-slate-400 font-medium">Saisissez les notes pour générer le rapport technique structuré.</p>
              </div>
            ) : (
              <div className="flex flex-col h-full space-y-8 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-2xl font-black text-slate-900 tracking-tight">Synthèse {brand}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Rapport validé par IA</p>
                  </div>
                  <button onClick={copyToClipboard} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${isCopied ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {isCopied ? <Check size={12}/> : <Copy size={12}/>} {isCopied ? 'Copié' : 'Copier'}
                  </button>
                </div>

                <div className="space-y-6 flex-grow overflow-y-auto pr-2 custom-scrollbar">
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100"><h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Objet</h5><p className="text-slate-900 font-black text-lg leading-tight">{tempSummary.subject}</p></div>
                  <div className="space-y-4">
                    <div><h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Diagnostic</h5><p className="text-sm text-slate-700 font-medium leading-relaxed">{tempSummary.issue}</p></div>
                    <div><h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Actions</h5><p className="text-sm text-slate-700 font-medium leading-relaxed">{tempSummary.solution}</p></div>
                    <div className="bg-blue-600 p-8 rounded-[2.5rem] shadow-xl text-white"><h5 className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-2">Décision SAV</h5><p className="text-base font-black leading-tight tracking-tight">{tempSummary.nextSteps}</p></div>
                  </div>
                </div>

                <button onClick={handleSave} className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-black text-xl flex items-center justify-center gap-4 transition-all shadow-xl shadow-emerald-500/20"><Save size={28}/> ENREGISTRER</button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
