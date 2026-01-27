
import { RawRow, RFMRecord, ColumnMapping, RFMSegment } from '../types';

const parseCurrency = (val: any): number => {
  if (val === null || val === undefined) return 0;
  let str = String(val).trim().replace(/[R\$\s]/g, '');
  if (!str) return 0;

  if (str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else {
    const dotCount = (str.match(/\./g) || []).length;
    const commaCount = (str.match(/,/g) || []).length;
    if (dotCount > 1) str = str.replace(/\./g, '');
    else if (commaCount > 1) str = str.replace(/,/g, '');
    else if (commaCount === 1 && dotCount === 1) str = str.replace(/,/g, '');
  }

  const cleaned = str.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

export const calculateRFM = (data: RawRow[], mapping: ColumnMapping): RFMRecord[] => {
  const customerData: Record<string, { name: string, dates: Date[], values: number[] }> = {};

  // 1. Agrupamento e Parsing Inicial
  data.forEach(row => {
    const cid = String(row[mapping.customerId]);
    const cName = mapping.customerName ? String(row[mapping.customerName]) : 'N/A';
    const dateStr = String(row[mapping.orderDate]);
    const val = parseCurrency(row[mapping.orderValue]);

    let date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      const parts = dateStr.split(/[\/\-]/);
      if (parts.length === 3) {
        // Tenta DD/MM/YYYY
        const d = parseInt(parts[0]);
        const m = parseInt(parts[1]) - 1;
        const y = parseInt(parts[2]);
        date = new Date(y, m, d);
      }
    }

    if (!isNaN(date.getTime())) {
      if (!customerData[cid]) {
        customerData[cid] = { name: cName, dates: [], values: [] };
      }
      customerData[cid].dates.push(date);
      customerData[cid].values.push(val);
    }
  });

  // 2. Encontrar a Data de Referência (A venda mais recente do arquivo)
  let maxDate = new Date(0);
  Object.values(customerData).forEach(c => {
    c.dates.forEach(d => {
      if (d > maxDate) maxDate = d;
    });
  });

  const records: Omit<RFMRecord, 'rScore' | 'fScore' | 'mScore' | 'rfmScore' | 'segment'>[] = [];

  // 3. Cálculo de R, F, M brutos
  Object.keys(customerData).forEach(cid => {
    const dates = customerData[cid].dates.sort((a, b) => b.getTime() - a.getTime());
    const latestDate = dates[0];
    // Recência em dias em relação ao último pedido do dataset
    const recency = Math.max(0, Math.floor((maxDate.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24)));
    const frequency = dates.length;
    const monetary = customerData[cid].values.reduce((a, b) => a + b, 0);

    records.push({ 
      customerId: cid, 
      customerName: customerData[cid].name,
      recency, 
      frequency, 
      monetary 
    });
  });

  // 4. Atribuição de Scores (1-5) via Quintis Populacionais
  // Função que atribui 1-5 baseado na posição do registro na lista ordenada
  const assignScores = (items: any[], key: keyof typeof items[0], inverse = false) => {
    const sorted = [...items].sort((a, b) => (a[key] as number) - (b[key] as number));
    const n = sorted.length;
    
    sorted.forEach((item, index) => {
      // Calcula o quintil (1 a 5)
      let score = Math.floor((index / n) * 5) + 1;
      // Para recência, quanto menor o valor (dias desde a última compra), maior o score
      if (inverse) score = 6 - score;
      
      const record = items.find(r => r.customerId === item.customerId);
      if (record) {
        if (key === 'recency') (record as any).rScore = score;
        if (key === 'frequency') (record as any).fScore = score;
        if (key === 'monetary') (record as any).mScore = score;
      }
    });
  };

  assignScores(records, 'recency', true); // Inverso: menos dias = nota 5
  assignScores(records, 'frequency', false); // Direto: mais frequencia = nota 5
  assignScores(records, 'monetary', false); // Direto: mais dinheiro = nota 5

  // 5. Finalização com Segmentos
  return records.map(r => {
    const rScore = (r as any).rScore;
    const fScore = (r as any).fScore;
    const mScore = (r as any).mScore;
    const rfmScore = `${rScore}${fScore}${mScore}`;
    const segment = assignSegment(rScore, fScore);

    return { ...r, rScore, fScore, mScore, rfmScore, segment } as RFMRecord;
  });
};

const assignSegment = (r: number, f: number): string => {
  if ((r === 5 || r === 4) && (f === 5 || f === 4)) return RFMSegment.CHAMPIONS;
  if ((r === 5 || r === 4 || r === 3) && (f === 5 || f === 4 || f === 3)) return RFMSegment.LOYAL;
  if ((r === 5 || r === 4) && (f === 2 || f === 3)) return RFMSegment.POTENTIAL_LOYALIST;
  if ((r === 5 || r === 4) && f === 1) return RFMSegment.NEW_CUSTOMERS;
  if ((r === 3 || r === 4) && f === 1) return RFMSegment.PROMISING;
  if ((r === 2 || r === 3) && (f === 2 || f === 3)) return RFMSegment.NEED_ATTENTION;
  if ((r === 2 || r === 3) && (f === 1 || f === 2)) return RFMSegment.ABOUT_TO_SLEEP;
  if ((r === 1 || r === 2) && (f >= 2)) return RFMSegment.AT_RISK;
  if (r === 1 && (f === 4 || f === 5)) return RFMSegment.CANT_LOSE_THEM;
  if (r === 1 || r === 2) return RFMSegment.HIBERNATING;
  return RFMSegment.LOST;
};
