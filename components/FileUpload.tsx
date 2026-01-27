
import React, { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle, FileSpreadsheet, Loader2 } from 'lucide-react';
import { RawRow } from '../types';
import Papa from 'papaparse';

interface FileUploadProps {
  onDataLoaded: (data: RawRow[], columns: string[]) => void;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, isLoading }) => {
  const [isParsing, setIsParsing] = useState(false);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: "UTF-8",
      complete: (results) => {
        const data = results.data as RawRow[];
        const meta = results.meta;
        
        // Validação básica se existem campos
        if (data.length > 0 && meta.fields && meta.fields.length > 0) {
           // Normalização de chaves para evitar problemas com BOM ou espaços
           const normalizedData = data.map(row => {
             const newRow: RawRow = {};
             Object.keys(row).forEach(key => {
               newRow[key.trim()] = row[key];
             });
             return newRow;
           });
           
           const normalizedHeaders = meta.fields.map(h => h.trim());
           onDataLoaded(normalizedData, normalizedHeaders);
        } else {
           alert("Não foi possível ler as colunas do arquivo. Verifique se o formato CSV está correto.");
        }
        setIsParsing(false);
      },
      error: (error) => {
        console.error("Erro ao ler CSV:", error);
        alert("Erro ao processar o arquivo. Tente salvar como CSV UTF-8.");
        setIsParsing(false);
      }
    });
  }, [onDataLoaded]);

  const showLoading = isLoading || isParsing;

  return (
    <div className="w-full max-w-3xl mx-auto p-12 border-2 border-dashed border-slate-800 rounded-3xl bg-[#1a1a1e] hover:border-orange-500/50 transition-all group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
      
      <div className="flex flex-col items-center justify-center space-y-6 relative z-10">
        <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
          {showLoading ? (
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
          ) : (
            <FileSpreadsheet className="w-12 h-12 text-orange-500" />
          )}
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-white tracking-tight">Importe seus dados estratégicos</h3>
          <p className="text-slate-400">Arraste sua planilha CSV ou clique para selecionar</p>
        </div>
        
        <label className={`relative cursor-pointer bg-white hover:bg-slate-200 text-slate-900 font-black py-4 px-10 rounded-2xl transition-all shadow-xl active:scale-95 ${showLoading ? 'opacity-50 pointer-events-none' : ''}`}>
          <span>{showLoading ? 'Processando...' : 'Explorar Arquivos'}</span>
          <input 
            type="file" 
            className="hidden" 
            accept=".csv" 
            onChange={handleFileChange}
            disabled={showLoading}
          />
        </label>

        <div className="pt-4 flex items-center space-x-3 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-900/50 py-3 px-8 rounded-full border border-slate-800/50">
          <AlertCircle className="w-4 h-4 text-orange-500/70" />
          <span>Suporta arquivos grandes (+50k linhas) em CSV.</span>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
