
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SegmentSummary, RFMRecord } from '../types';
import { SEGMENT_COLORS } from '../constants';

export const exportToPDF = (
  summaries: SegmentSummary[],
  records: RFMRecord[],
  aiInsights: string | null
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Helper para converter hex em RGB
  const hexToRgb = (hex: string): [number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };

  // Header - Estilo Dark Premium do Grupo Vorp
  doc.setFillColor(9, 9, 11); // Dark bg
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Linha de acento laranja
  doc.setFillColor(255, 92, 0); 
  doc.rect(0, 44, pageWidth, 1, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('ANÁLISE ESTRATÉGICA RFM', 15, 22);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(150, 150, 150);
  doc.text('POWERED BY GRUPO VORP', 15, 30);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Relatório: ${new Date().toLocaleString('pt-BR')}`, pageWidth - 15, 25, { align: 'right' });

  // Visão Geral do Negócio
  const totalCustomers = records.length;
  const totalRevenue = records.reduce((acc, curr) => acc + curr.monetary, 0);
  const avgTicket = totalRevenue / (totalCustomers || 1);

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Indicadores de Performance Consolidados', 15, 60);

  autoTable(doc, {
    startY: 65,
    head: [['Métrica de Negócio', 'Valor']],
    body: [
      ['Base de Dados Processada', `${totalCustomers.toLocaleString('pt-BR')} clientes`],
      ['Faturamento Bruto Identificado', `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ['Ticket Médio da Base (AOV)', `R$ ${avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 4 }
  });

  // Gráfico de Barras - Distribuição de Segmentos (Evitando mutação com [...summaries])
  const chartStartY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  doc.text('Distribuição Visual de Clientes', 15, chartStartY);

  const sortedSummaries = [...summaries].sort((a, b) => b.count - a.count);
  const maxCount = Math.max(...summaries.map(s => s.count));
  const chartAreaWidth = pageWidth - 70;
  let currentY = chartStartY + 10;

  sortedSummaries.forEach(s => {
    const barWidth = maxCount > 0 ? (s.count / maxCount) * chartAreaWidth : 0;
    const rgb = hexToRgb(SEGMENT_COLORS[s.name] || '#cccccc');
    
    // Label
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text(s.name.toUpperCase(), 15, currentY + 4);

    // Background da barra (sombra suave)
    doc.setFillColor(245, 245, 245);
    doc.rect(50, currentY, chartAreaWidth, 5, 'F');

    // Barra de dados
    doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    doc.rect(50, currentY, Math.max(barWidth, 1), 5, 'F');

    // Valor à direita
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(8);
    doc.text(`${s.count} (${s.percentage.toFixed(1)}%)`, 55 + chartAreaWidth, currentY + 4);

    currentY += 8;
  });

  // Tabela Técnica (Nova página)
  doc.addPage();
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Análise Técnica por Grupo de Valor', 15, 20);

  const segmentRows = sortedSummaries.map(s => [
    s.name,
    s.count,
    `${s.percentage.toFixed(1)}%`,
    `${s.avgRecency.toFixed(0)}d`,
    `${s.avgFrequency.toFixed(1)}`,
    `R$ ${s.avgMonetary.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
  ]);

  autoTable(doc, {
    startY: 25,
    head: [['Segmento', 'Qtd', '%', 'Recência', 'Freq.', 'Ticket Médio']],
    body: segmentRows,
    theme: 'striped',
    headStyles: { fillColor: [255, 92, 0], textColor: [255, 255, 255] },
    styles: { fontSize: 8 }
  });

  // AI Insights
  if (aiInsights) {
    doc.addPage();
    doc.setFillColor(9, 9, 11);
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('Estratégia Recomendada (Analista IA)', 15, 16);

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const cleanInsights = aiInsights
      .replace(/\*\*/g, '')
      .replace(/###/g, '')
      .replace(/##/g, '');

    const splitText = doc.splitTextToSize(cleanInsights, pageWidth - 30);
    doc.text(splitText, 15, 40);
  }

  // Footer
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text(`GRUPO VORP - RELATÓRIO CONFIDENCIAL RFM | Página ${i} de ${totalPages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }

  doc.save(`Relatorio_RFM_Vorp_${new Date().toISOString().split('T')[0]}.pdf`);
};
