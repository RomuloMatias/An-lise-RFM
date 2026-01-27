
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sparkles, BarChart2, Database, ChevronRight, Settings, Users, 
  Calendar, DollarSign, Download, Search, Bell, Copy, Check, User
} from 'lucide-react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import { RawRow, RFMRecord, ColumnMapping } from './types';
import { calculateRFM } from './services/rfmService';
import { getAIInsights } from './services/geminiService';
import { exportToPDF } from './services/pdfService';
import { marked } from 'marked';

const App: React.FC = () => {
  const [data, setData] = useState<RawRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({ customerId: '', customerName: '', orderDate: '', orderValue: '' });
  const [rfmRecords, setRfmRecords] = useState<RFMRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [copied, setCopied] = useState(false);

  const summaries = useMemo(() => {
    if (rfmRecords.length === 0) return [];
    const counts: Record<string, { count: number; r: number; f: number; m: number }> = {};
    
    rfmRecords.forEach(r => {
      if (!counts[r.segment]) counts[r.segment] = { count: 0, r: 0, f: 0, m: 0 };
      counts[r.segment].count++;
      counts[r.segment].r += r.recency;
      counts[r.segment].f += r.frequency;
      counts[r.segment].m += r.monetary;
    });

    return Object.keys(counts).map(name => ({
      name,
      count: counts[name].count,
      percentage: (counts[name].count / rfmRecords.length) * 100,
      avgRecency: counts[name].r / counts[name].count,
      avgFrequency: counts[name].f / counts[name].count,
      avgMonetary: counts[name].m / counts[name].count,
    }));
  }, [rfmRecords]);

  const handleDataLoaded = (jsonData: RawRow[], cols: string[]) => {
    setData(jsonData);
    setHeaders(cols);
    setStep(2);
    setMapping({
      customerId: cols.find(c => /id|customer_id|cliente_id|codigo/i.test(c)) || '',
      customerName: cols.find(c => /name|nome|contato|razao|cliente/i.test(c)) || '',
      orderDate: cols.find(c => /date|data|emissao/i.test(c)) || '',
      orderValue: cols.find(c => /value|valor|total|amount|bruto/i.test(c)) || ''
    });
  };

  const handleRunAnalysis = () => {
    if (!mapping.customerId || !mapping.orderDate || !mapping.orderValue) {
      alert("Por favor, mapeie as colunas obrigatórias (ID, Data e Valor).");
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      const results = calculateRFM(data, mapping);
      setRfmRecords(results);
      setStep(3);
      setIsLoading(false);
    }, 800);
  };

  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    const insights = await getAIInsights(summaries);
    setAiInsights(insights);
    setIsGeneratingAI(false);
  };

  const handleCopyInsights = () => {
    if (!aiInsights) return;
    navigator.clipboard.writeText(aiInsights);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = () => {
    exportToPDF(summaries, rfmRecords, aiInsights || null);
  };

  const formattedInsights = useMemo(() => {
    if (!aiInsights) return '';
    return marked(aiInsights);
  }, [aiInsights]);

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-200">
      <header className="h-24 border-b border-slate-800/40 px-8 flex items-center justify-between sticky top-0 bg-[#09090b]/80 backdrop-blur-xl z-50">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-[#ff5c00] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-900/20">
            <BarChart2 className="text-white w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none">Analise RFM</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Powered By Grupo Vorp</p>
          </div>
        </div>

        <div className="hidden lg:flex items-center bg-[#161618] px-6 py-3 rounded-2xl border border-slate-800/50 space-x-6">
          <StepItem number={1} label="Upload" active={step === 1} completed={step > 1} />
          <ChevronRight className="w-4 h-4 text-slate-700" />
          <StepItem number={2} label="Mapeamento" active={step === 2} completed={step > 2} />
          <ChevronRight className="w-4 h-4 text-slate-700" />
          <StepItem number={3} label="Resultados" active={step === 3} completed={step > 3} />
        </div>

        <div className="flex items-center space-x-4">
          <button className="p-2.5 bg-[#161618] rounded-xl text-slate-400 hover:text-white border border-slate-800 transition-all">
            <Bell className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-gradient-to-tr from-orange-600 to-rose-500 rounded-full border-2 border-[#09090b] shadow-xl"></div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {step === 1 && (
          <div className="py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-5xl font-black text-white tracking-tighter leading-tight">
                Segmentação de Clientes<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-300">Inteligência Estratégica</span>
              </h2>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
                Transforme dados brutos em ações de marketing precisas usando nossa ferramenta de análise RFM avançada.
              </p>
            </div>
            <FileUpload onDataLoaded={handleDataLoaded} isLoading={isLoading} />
          </div>
        )}

        {step === 2 && (
          <div className="max-w-3xl mx-auto bg-[#161618] rounded-[2rem] shadow-2xl border border-slate-800 overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="p-10 border-b border-slate-800/50 flex items-center space-x-5">
              <div className="p-4 bg-orange-600/10 rounded-2xl">
                <Settings className="w-6 h-6 text-[#ff5c00]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Mapear Colunas</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Configuração da Base de Dados</p>
              </div>
            </div>
            <div className="p-10 space-y-8">
              <div className="space-y-6">
                <MappingSelect label="Identificador do Cliente (ID)" icon={Users} value={mapping.customerId} onChange={(v: string) => setMapping({...mapping, customerId: v})} options={headers} />
                <MappingSelect label="Nome do Cliente (Opcional)" icon={User} value={mapping.customerName} onChange={(v: string) => setMapping({...mapping, customerName: v})} options={headers} />
                <MappingSelect label="Data da Transação" icon={Calendar} value={mapping.orderDate} onChange={(v: string) => setMapping({...mapping, orderDate: v})} options={headers} />
                <MappingSelect label="Valor da Venda" icon={DollarSign} value={mapping.orderValue} onChange={(v: string) => setMapping({...mapping, orderValue: v})} options={headers} />
              </div>

              <div className="pt-8 flex items-center justify-between">
                <button onClick={() => setStep(1)} className="px-8 py-3 text-slate-500 hover:text-white font-bold transition-all">Cancelar</button>
                <button 
                  onClick={handleRunAnalysis}
                  disabled={isLoading}
                  className="px-10 py-4 bg-[#ff5c00] hover:bg-orange-500 text-white rounded-2xl font-black shadow-2xl shadow-orange-900/30 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? 'Calculando...' : 'Processar Análise'}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="flex items-center space-x-2 text-[#ff5c00] font-bold text-[10px] uppercase tracking-[0.3em] mb-2">
                   <div className="w-4 h-[2px] bg-[#ff5c00]"></div>
                   <span>Análise em Tempo Real</span>
                </div>
                <h2 className="text-4xl font-black text-white tracking-tighter">Visão de Performance</h2>
              </div>
              
              <div className="flex items-center space-x-3">
                <button 
                  onClick={handleExportPDF}
                  className="flex items-center space-x-2 bg-[#161618] border border-slate-800 text-slate-300 px-6 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl"
                >
                  <Download className="w-5 h-5 text-slate-500" />
                  <span>PDF</span>
                </button>
                <button 
                  onClick={handleGenerateAI}
                  disabled={isGeneratingAI}
                  className="flex items-center space-x-3 bg-gradient-to-br from-indigo-600 to-purple-700 text-white px-8 py-3 rounded-2xl font-black shadow-2xl shadow-indigo-900/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-70"
                >
                  <Sparkles className={`w-5 h-5 ${isGeneratingAI ? 'animate-pulse' : ''}`} />
                  <span>{isGeneratingAI ? 'Gerando...' : 'Insights IA'}</span>
                </button>
              </div>
            </div>

            {aiInsights && (
              <div className="bg-[#161618] border border-indigo-500/20 p-10 rounded-[2rem] relative overflow-hidden animate-in slide-in-from-top-4 duration-500 shadow-2xl">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                  <Sparkles className="w-32 h-32 text-indigo-400" />
                </div>
                
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <h3 className="text-xl font-bold text-indigo-400 flex items-center space-x-3">
                    <Sparkles className="w-6 h-6" />
                    <span>Estratégia do Especialista IA</span>
                  </h3>
                  <button 
                    onClick={handleCopyInsights}
                    className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-700/50 transition-all"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copiado' : 'Copiar Texto'}</span>
                  </button>
                </div>

                <div 
                  className="prose prose-invert max-w-none text-slate-400 text-sm leading-relaxed relative z-10"
                  dangerouslySetInnerHTML={{ __html: formattedInsights }}
                />
              </div>
            )}

            <Dashboard records={rfmRecords} summaries={summaries} />
          </div>
        )}
      </main>

      <footer className="mt-20 border-t border-slate-800/30 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-xs font-bold text-slate-600 uppercase tracking-widest gap-6">
          <p>© 2024 Grupo Vorp RFM Analyzer. Todos os direitos reservados.</p>
          <div className="flex space-x-10">
            <a href="#" className="hover:text-white transition-colors">Suporte</a>
            <a href="#" className="hover:text-white transition-colors">API</a>
            <a href="#" className="hover:text-white transition-colors">Segurança</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const StepItem = ({ number, label, active, completed }: any) => (
  <div className={`flex items-center space-x-3 transition-all ${active ? 'opacity-100' : completed ? 'opacity-70' : 'opacity-30'}`}>
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black transition-all ${
      active ? 'bg-[#ff5c00] text-white shadow-lg shadow-orange-900/30 ring-4 ring-orange-500/10' : completed ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'
    }`}>
      {number}
    </div>
    <span className={`text-sm font-bold tracking-tight ${active ? 'text-white' : 'text-slate-500'}`}>{label}</span>
  </div>
);

const MappingSelect = ({ label, icon: Icon, value, onChange, options }: any) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black text-slate-500 flex items-center space-x-2 uppercase tracking-[0.2em]">
      <Icon className="w-4 h-4 text-slate-600" />
      <span>{label}</span>
    </label>
    <div className="relative group">
      <select 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#09090b] border border-slate-800 text-slate-200 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-orange-500/30 outline-none transition-all appearance-none cursor-pointer group-hover:border-slate-700"
      >
        <option value="">Selecione...</option>
        {options.map((h: string) => <option key={h} value={h}>{h}</option>)}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 group-hover:text-slate-400 transition-colors">
        <ChevronRight className="w-5 h-5 rotate-90" />
      </div>
    </div>
  </div>
);

export default App;
