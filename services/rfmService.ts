
import { RawRow, RFMRecord, ColumnMapping, RFMSegment } from '../types';

const parseCurrency = (val: any): number => {
  if (val === null || val === undefined) return 0;
  let str = String(val).trim().replace(/[R\$\s]/g, '');
  if (!str) return 0;

  if (str.includes(',')) {
    // Formato Brasileiro: 1.000,00 -> 1000.00
    // Se tiver virgula, assume que é decimal
    str = str.replace(/\./g, '').replace(',', '.');
  } else {
    // Se não tem virgula, verifica pontos
    const dotCount = (str.match(/\./g) || []).length;
    if (dotCount > 1) str = str.replace(/\./g, '');
  }

  const cleaned = str.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

const parseDate = (val: any): Date => {
  if (!val) return new Date('Invalid');
  
  // Tenta criar data direta (ISO ou padrão US)
  let date = new Date(val);
  if (!isNaN(date.getTime())) return date;

  const str = String(val).trim();
  
  // Tenta formato BR (DD/MM/YYYY) ou com hora
  // Regex simples para capturar dia, mes, ano
  const match = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (match) {
    const d = parseInt(match[1]);
    const m = parseInt(match[2]) - 1;
    let y = parseInt(match[3]);
    if (y < 100) y += 2000; // Ajuste ano curto
    const newDate = new Date(y, m, d);
    if (!isNaN(newDate.getTime())) return newDate;
  }

  return new Date('Invalid');
};

export const calculateRFM = (data: RawRow[], mapping: ColumnMapping): RFMRecord[] => {
  const customerData: Record<string, { name: string, salesperson: string, dates: Date[], values: number[] }> = {};

  // 1. Agrupamento Eficiente
  // Iteração única O(N) para consolidar transações em clientes
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const cid = row[mapping.customerId];
    
    // Ignora linhas sem ID
    if (!cid || String(cid).trim() === '') continue;

    const cidStr = String(cid).trim();
    const cName = mapping.customerName && row[mapping.customerName] ? String(row[mapping.customerName]) : 'Cliente ' + cidStr;
    // Captura o vendedor se mapeado, senão usa "N/A"
    const cSalesperson = mapping.salesperson && row[mapping.salesperson] ? String(row[mapping.salesperson]) : 'N/A';
    
    const dateVal = row[mapping.orderDate];
    const val = parseCurrency(row[mapping.orderValue]);
    const date = parseDate(dateVal);

    if (!isNaN(date.getTime())) {
      if (!customerData[cidStr]) {
        // Inicializa com o vendedor encontrado na primeira linha deste cliente
        // (Assumindo que o cliente pertence a um vendedor principal, ou pega o último)
        customerData[cidStr] = { name: cName, salesperson: cSalesperson, dates: [], values: [] };
      }
      
      // Opcional: Atualizar vendedor para o mais recente se a linha atual for mais nova?
      // Por performance e simplicidade, mantemos o primeiro encontrado ou atualizamos sempre.
      // Vamos manter o último encontrado na iteração (comportamento padrão de overwrite se a tabela estiver ordenada por data, senão é aleatório).
      // Para consistência, se o vendedor for diferente de N/A, atualizamos.
      if (cSalesperson !== 'N/A') {
          customerData[cidStr].salesperson = cSalesperson;
      }

      customerData[cidStr].dates.push(date);
      customerData[cidStr].values.push(val);
    }
  }

  // 2. Encontrar a Data de Referência (O(C * T) onde C=clientes, T=transações médias)
  let maxDate = new Date(0);
  const customers = Object.keys(customerData);
  
  if (customers.length === 0) return [];

  customers.forEach(cid => {
    const dates = customerData[cid].dates;
    for (let d of dates) {
      if (d > maxDate) maxDate = d;
    }
  });

  const records: any[] = [];

  // 3. Cálculo de R, F, M absolutos (O(C))
  customers.forEach(cid => {
    const data = customerData[cid];
    // Ordena datas apenas do cliente (rápido)
    data.dates.sort((a, b) => b.getTime() - a.getTime());
    
    const latestDate = data.dates[0];
    const recency = Math.max(0, Math.floor((maxDate.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24)));
    const frequency = data.dates.length;
    const monetary = data.values.reduce((a, b) => a + b, 0);

    records.push({ 
      customerId: cid, 
      customerName: data.name,
      salesperson: data.salesperson, // Passa o vendedor para o registro final
      recency,
      lastPurchaseDate: latestDate,
      frequency, 
      monetary,
      rScore: 0,
      fScore: 0,
      mScore: 0
    });
  });

  // 4. Atribuição de Scores Otimizada (O(C log C))
  
  const assignScores = (key: 'recency' | 'frequency' | 'monetary', inverse = false) => {
    const sorted = [...records].sort((a, b) => (a[key] as number) - (b[key] as number));
    const n = sorted.length;
    
    for (let i = 0; i < n; i++) {
      let score = Math.floor((i / n) * 5) + 1;
      if (inverse) score = 6 - score;
      
      // Atribuição direta por referência
      if (key === 'recency') sorted[i].rScore = score;
      if (key === 'frequency') sorted[i].fScore = score;
      if (key === 'monetary') sorted[i].mScore = score;
    }
  };

  assignScores('recency', true);
  assignScores('frequency', false);
  assignScores('monetary', false);

  // 5. Finalização
  return records.map(r => {
    const rfmScore = `${r.rScore}${r.fScore}${r.mScore}`;
    const segment = assignSegment(r.rScore, r.fScore);
    return { ...r, rfmScore, segment } as RFMRecord;
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
