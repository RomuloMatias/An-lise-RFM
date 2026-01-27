
export const SEGMENT_COLORS: Record<string, string> = {
  'Campeões': '#10b981',
  'Clientes Leais': '#3b82f6',
  'Lealdade Potencial': '#6366f1',
  'Novos Clientes': '#a855f7',
  'Promissores': '#ec4899',
  'Precisam de Atenção': '#f59e0b',
  'Prestes a Dormir': '#f97316',
  'Em Risco': '#ef4444',
  'Não Podemos Perder': '#7c3aed',
  'Hibernando': '#64748b',
  'Perdidos': '#1e293b'
};

export const SEGMENT_DESCRIPTIONS: Record<string, string> = {
  'Campeões': 'Compraram recentemente, compram com frequência e gastam muito.',
  'Clientes Leais': 'Gastam bem e respondem a promoções.',
  'Lealdade Potencial': 'Clientes recentes, mas que gastaram uma boa quantia.',
  'Novos Clientes': 'Compraram recentemente, mas não com frequência.',
  'Promissores': 'Compradores recentes, mas ainda não gastaram muito.',
  'Precisam de Atenção': 'Recência, frequência e valores monetários acima da média.',
  'Prestes a Dormir': 'Recência e frequência abaixo da média. Vamos perdê-los se não agirmos.',
  'Em Risco': 'Gastaram muito e compraram com frequência, mas faz tempo que não voltam.',
  'Não Podemos Perder': 'Fizeram grandes compras e com frequência, mas faz muito tempo que não voltam.',
  'Hibernando': 'A última compra foi há muito tempo e o número de pedidos é baixo.',
  'Perdidos': 'Menores pontuações em recência, frequência e valor.'
};
