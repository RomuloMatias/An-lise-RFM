
import React, { useCallback } from 'react';
import { Upload, FileText, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { RawRow } from '../types';

interface FileUploadProps {
  onDataLoaded: (data: RawRow[], columns: string[]) => void;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, isLoading }) => {
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split(/\r?\n/).filter(row => row.trim() !== '');
      if (rows.length < 2) return;

      // Detectar delimitador (CSV padrão vs Brasileiro/Europeu)
      const firstLine = rows[0];
      const delimiter = firstLine.includes(';') ? ';' : ',';

      const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
      const jsonData = rows.slice(1).map(row => {
        const values = row.split(delimiter);
        const obj: RawRow = {};
        headers.forEach((header, i) => {
          // Remover aspas extras se houver
          obj[header] = values[i]?.trim().replace(/^"|"$/g, '');
        });
        return obj;
      });

      onDataLoaded(jsonData, headers);
    };
    reader.readAsText(file, 'UTF-8');
  }, [onDataLoaded]);

  return (
    <div className="w-full max-w-3xl mx-auto p-12 border-2 border-dashed border-slate-800 rounded-3xl bg-[#1a1a1e] hover:border-orange-500/50 transition-all group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
      
      <div className="flex flex-col items-center justify-center space-y-6 relative z-10">
        <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
          <FileSpreadsheet className="w-12 h-12 text-orange-500" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-white tracking-tight">Importe seus dados estratégicos</h3>
          <p className="text-slate-400">Arraste sua planilha CSV ou clique para selecionar</p>
        </div>
        
        <label className="relative cursor-pointer bg-white hover:bg-slate-200 text-slate-900 font-black py-4 px-10 rounded-2xl transition-all shadow-xl active:scale-95 disabled:opacity-50">
          <span>{isLoading ? 'Lendo Arquivo...' : 'Explorar Arquivos'}</span>
          <input 
            type="file" 
            className="hidden" 
            accept=".csv" 
            onChange={handleFileChange}
            disabled={isLoading}
          />
        </label>

        <div className="pt-4 flex items-center space-x-3 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-900/50 py-3 px-8 rounded-full border border-slate-800/50">
          <AlertCircle className="w-4 h-4 text-orange-500/70" />
          <span>Formato sugerido: CSV com delimitador vírgula ou ponto-e-vírgula.</span>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
