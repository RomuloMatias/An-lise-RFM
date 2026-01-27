
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { RFMRecord, SegmentSummary } from '../types';
import { SEGMENT_COLORS, SEGMENT_DESCRIPTIONS } from '../constants';
import { Users, DollarSign, Grid3X3, ArrowUpRight, ShoppingBag, Target, Search, Filter, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

interface DashboardProps {
  records: RFMRecord[];
  summaries: SegmentSummary[];
}

const Dashboard: React.FC<DashboardProps> = ({ records, summaries }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSegment, setFilterSegment] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalCustomers = records.length;
  const totalRevenue = records.reduce((acc, curr) => acc + curr.monetary, 0);
  const avgFrequency = records.reduce((acc, curr) => acc + curr.frequency, 0) / (totalCustomers || 1);
  const avgRecency = records.reduce((acc, curr) => acc + curr.recency, 0) / (totalCustomers || 1);

  const matrixData = Array.from({ length: 5 }, (_, fIdx) => {
    const fScore = 5 - fIdx;
    return Array.from({ length: 5 }, (_, rIdx) => {
      const rScore = rIdx + 1;
      const cellRecords = records.filter(rec => rec.rScore === rScore && rec.fScore === fScore);
      const segmentCounts: Record<string, number> = {};
      cellRecords.forEach(rec => {
        segmentCounts[rec.segment] = (segmentCounts[rec.segment] || 0) + 1;
      });
      const dominantSegment = Object.entries(segmentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Perdidos';

      return {
        rScore,
        fScore,
        count: cellRecords.length,
        segment: dominantSegment
      };
    });
  });

  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      const matchesSearch = 
        rec.customerId.toLowerCase().includes(searchTerm.toLowerCase()) || 
        rec.customerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSegment = filterSegment === '' || rec.segment === filterSegment;
      return matchesSearch && matchesSegment;
    });
  }, [records, searchTerm, filterSegment]);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  const StatCard = ({ title, value, icon: Icon, colorClass, gradientColor, trend }: any) => (
    <div className={`bg-[#161618] p-6 rounded-xl border border-slate-800/50 relative overflow-hidden group shadow-lg transition-all`}>
      <div className={`absolute -right-8 -top-8 w-32 h-32 bg-${gradientColor}-500 opacity-5 blur-3xl rounded-full group-hover:opacity-10 transition-opacity`}></div>
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-lg ${colorClass} shadow-xl`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          {trend && (
            <div className="flex items-center space-x-1 text-emerald-400 font-bold text-[9px] bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
              <ArrowUpRight className="w-3 h-3" />
              <span>{trend}</span>
            </div>
          )}
        </div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{title}</p>
        <h4 className="text-xl md:text-2xl font-black text-white tracking-tighter whitespace-nowrap">{value}</h4>
      </div>
    </div>
  );

  const ScoreBadge = ({ score, label }: { score: number, label: string }) => {
    const getColor = (s: number) => {
      if (s >= 4) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      if (s >= 3) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    };
    return (
      <div className={`flex flex-col items-center px-2 py-1 rounded border ${getColor(score)} min-w-[40px]`}>
        <span className="text-[8px] font-black uppercase opacity-60">{label}</span>
        <span className="text-xs font-black">{score}</span>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Aviso de Motor Local */}
      <div className="flex items-center space-x-3 bg-emerald-500/5 border border-emerald-500/10 px-6 py-3 rounded-2xl">
        <div className="p-2 bg-emerald-500/20 rounded-lg">
          <Zap className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Motor Matemático Ativado</p>
          <p className="text-xs text-slate-500 font-medium italic">Todos os cálculos RFM foram processados localmente via quintis populacionais para garantir precisão absoluta.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Faturamento Total" 
          value={`R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          icon={DollarSign} 
          colorClass="bg-gradient-to-br from-orange-600 to-amber-500" 
          gradientColor="orange"
          trend="+12.4%"
        />
        <StatCard 
          title="Total de Clientes" 
          value={totalCustomers.toLocaleString('pt-BR')} 
          icon={Users} 
          colorClass="bg-gradient-to-br from-blue-600 to-indigo-500" 
          gradientColor="blue"
          trend="+3.2%"
        />
        <StatCard 
          title="Frequência Média" 
          value={avgFrequency.toFixed(2)} 
          icon={ShoppingBag} 
          colorClass="bg-gradient-to-br from-purple-600 to-pink-500" 
          gradientColor="purple"
          trend="+5.1%"
        />
        <StatCard 
          title="Média de Recência" 
          value={`${avgRecency.toFixed(0)}d`} 
          icon={Target} 
          colorClass="bg-gradient-to-br from-rose-600 to-red-500" 
          gradientColor="rose"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-[#161618] p-10 rounded-xl border border-slate-800 shadow-xl overflow-visible">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center space-x-4">
              <div className="p-2.5 bg-orange-600/10 rounded-lg">
                <Grid3X3 className="w-5 h-5 text-[#ff5c00]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Grade de Segmentação</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Mapa R vs F</p>
              </div>
            </div>
            <div className="text-[10px] text-slate-600 font-black uppercase tracking-tighter">N=5x5 Quintis</div>
          </div>
          
          <div className="flex flex-row items-center justify-center pt-4">
            <div className="flex flex-col items-center justify-center mr-8 -rotate-90">
               <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] whitespace-nowrap">Frequência</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-stretch">
                <div className="flex flex-col justify-between py-2 mr-6 h-[300px]">
                  {[5, 4, 3, 2, 1].map(score => (
                    <span key={score} className="text-[11px] font-bold text-slate-500">{score}</span>
                  ))}
                </div>
                <div className="grid grid-cols-5 gap-2 w-[300px] h-[300px]">
                  {matrixData.flat().map((cell, idx) => (
                    <div 
                      key={idx}
                      className="rounded-lg flex items-center justify-center transition-all hover:scale-110 cursor-default group relative border border-white/5"
                      style={{ 
                        backgroundColor: cell.count > 0 ? `${SEGMENT_COLORS[cell.segment]}dd` : '#0d0d0f',
                      }}
                    >
                      <span className={`text-[12px] font-bold transition-all ${cell.count > 0 ? 'text-white' : 'text-slate-800'}`}>
                        {cell.count > 0 ? cell.count : ''}
                      </span>
                      {cell.count > 0 && (
                        <div className="hidden group-hover:block absolute -top-14 left-1/2 -translate-x-1/2 z-50 bg-white text-slate-900 text-[10px] font-black px-3 py-2 rounded-lg shadow-2xl whitespace-nowrap">
                          {cell.segment}: {cell.count}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-white"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between ml-10 mt-6 px-1 w-[300px]">
                {[1, 2, 3, 4, 5].map(score => (
                  <span key={score} className="text-[11px] font-bold text-slate-500">{score}</span>
                ))}
              </div>
              <div className="text-center mt-6 ml-10">
                 <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] whitespace-nowrap">Recência</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#161618] p-8 rounded-xl border border-slate-800 shadow-xl flex flex-col">
          <h3 className="text-lg font-bold text-white mb-6 tracking-tight">Participação na Base</h3>
          <div className="flex-grow min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summaries}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="name"
                >
                  {summaries.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SEGMENT_COLORS[entry.name]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161618', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc', fontSize: '10px' }}
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '20px', fontSize: '9px', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detalhamento por Cliente */}
      <div className="bg-[#161618] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-800/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Detalhamento por Cliente</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Análise individualizada de comportamento</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text"
                  placeholder="Buscar ID ou Nome..."
                  className="bg-[#0d0d0f] border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-orange-500 outline-none w-full sm:w-64 transition-all"
                  value={searchTerm}
                  onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
                />
              </div>
              
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select 
                  className="bg-[#0d0d0f] border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-orange-500 outline-none w-full sm:w-56 appearance-none cursor-pointer"
                  value={filterSegment}
                  onChange={(e) => {setFilterSegment(e.target.value); setCurrentPage(1);}}
                >
                  <option value="">Todos os Segmentos</option>
                  {summaries.map(s => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#0d0d0f]/30 border-b border-slate-800">
                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Cliente</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Segmento</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Scores RFM</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Faturamento Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {paginatedRecords.length > 0 ? paginatedRecords.map((rec) => (
                <tr key={rec.customerId} className="hover:bg-white/5 transition-all group">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-white text-sm line-clamp-1">{rec.customerName}</span>
                      <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">{rec.customerId}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SEGMENT_COLORS[rec.segment] }}></div>
                      <span className="text-xs font-bold text-white">{rec.segment}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-center space-x-3">
                      <ScoreBadge score={rec.rScore} label="R" />
                      <ScoreBadge score={rec.fScore} label="F" />
                      <ScoreBadge score={rec.mScore} label="M" />
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-white text-sm">R$ {rec.monetary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      <span className="text-[8px] text-slate-500 font-black uppercase tracking-tighter">{rec.frequency} transações</span>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center opacity-30">
                      <Search className="w-12 h-12 mb-4" />
                      <p className="font-black uppercase tracking-widest text-sm">Nenhum cliente encontrado</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-8 py-6 border-t border-slate-800/50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Mostrando {Math.min(filteredRecords.length, (currentPage - 1) * itemsPerPage + 1)} a {Math.min(filteredRecords.length, currentPage * itemsPerPage)} de {filteredRecords.length}
            </span>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-[#0d0d0f] border border-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center px-4">
                <span className="text-xs font-black text-white">{currentPage}</span>
                <span className="text-xs font-bold text-slate-600 mx-2">/</span>
                <span className="text-xs font-bold text-slate-600">{totalPages}</span>
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 bg-[#0d0d0f] border border-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#161618] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800/50">
          <h3 className="text-lg font-bold text-white tracking-tight">Performance por Segmento</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Visão Analítica Agrupada</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#0d0d0f]/30 border-b border-slate-800">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Segmento</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Clientes</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Ticket Médio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {[...summaries].sort((a, b) => b.count - a.count).map((s) => (
                <tr key={s.name} className="hover:bg-white/5 transition-all group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-white text-sm mb-1">{s.name}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SEGMENT_COLORS[s.name] }}></div>
                        <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider line-clamp-1">{SEGMENT_DESCRIPTIONS[s.name].split('.')[0]}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-slate-400 font-bold text-xs">{s.count.toLocaleString('pt-BR')}</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-white text-sm">R$ {s.avgMonetary.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span className="text-[8px] text-emerald-500/60 font-black uppercase">Ticket Médio</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
