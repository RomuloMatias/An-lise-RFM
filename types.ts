
export interface RawRow {
  [key: string]: any;
}

export interface RFMRecord {
  customerId: string;
  customerName: string;
  salesperson: string; // New field for Salesperson
  recency: number; // Days since last purchase
  lastPurchaseDate: Date; // Actual date of last purchase
  frequency: number; // Count of purchases
  monetary: number; // Total value
  rScore: number;
  fScore: number;
  mScore: number;
  rfmScore: string;
  segment: string;
}

export interface ColumnMapping {
  customerId: string;
  customerName: string;
  salesperson: string; // New mapping field
  orderDate: string;
  orderValue: string;
}

export interface SegmentSummary {
  name: string;
  count: number;
  avgRecency: number;
  avgFrequency: number;
  avgMonetary: number;
  percentage: number;
}

export enum RFMSegment {
  CHAMPIONS = 'Campeões',
  LOYAL = 'Clientes Leais',
  POTENTIAL_LOYALIST = 'Lealdade Potencial',
  NEW_CUSTOMERS = 'Novos Clientes',
  PROMISING = 'Promissores',
  NEED_ATTENTION = 'Precisam de Atenção',
  ABOUT_TO_SLEEP = 'Prestes a Dormir',
  AT_RISK = 'Em Risco',
  CANT_LOSE_THEM = 'Não Podemos Perder',
  HIBERNATING = 'Hibernando',
  LOST = 'Perdidos'
}
