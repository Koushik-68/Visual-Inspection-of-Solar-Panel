import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Panel } from '../types';
import { formatDate } from './panelUtils';

export const generatePanelReport = (panel: Panel): void => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text(`Panel Report: ${panel.id}`, 14, 22);
  
  // Panel Details
  doc.setFontSize(12);
  doc.text('Panel Details', 14, 35);
  
  const details = [
    ['Company Name', panel.companyName],
    ['Size', `${panel.size.width}m × ${panel.size.height}m`],
    ['Max Output', `${panel.maxOutput}W`],
    ['Current Output', `${panel.currentOutput}W`],
    ['Last Inspection', formatDate(panel.lastInspection)],
    ['Current Fault', `${panel.currentFault.description} (${panel.currentFault.level})`],
    ['Priority', panel.priority],
    ['Maintenance', panel.maintenanceSuggestion],
  ];
  
  autoTable(doc, {
    startY: 40,
    head: [['Property', 'Value']],
    body: details,
    theme: 'grid',
  });
  
  // Inspection History
  doc.text('Inspection History', 14, doc.lastAutoTable.finalY + 15);
  
  if (panel.inspectionHistory.length > 0) {
    const historyData = panel.inspectionHistory.map(record => [
      formatDate(record.date),
      record.description,
      record.faultLevel,
      record.inspector
    ]);
    
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Date', 'Description', 'Fault Level', 'Inspector']],
      body: historyData,
      theme: 'striped',
    });
  } else {
    doc.text('No inspection history available.', 14, doc.lastAutoTable.finalY + 25);
  }
  
  // Footer
  const today = new Date();
  doc.setFontSize(10);
  doc.text(`Report generated on ${today.toLocaleDateString()}`, 14, 280);
  
  // Save the PDF
  doc.save(`${panel.id.replace(/\s+/g, '_')}_Report.pdf`);
};

export const generateGridReport = (panels: Panel[]): void => {
  const doc = new jsPDF('landscape');
  
  // Title
  doc.setFontSize(20);
  doc.text('Solar Panel Grid Inspection Report', 14, 22);
  
  // Summary
  const faultCounts = {
    high: panels.filter(p => p.currentFault.level === 'high').length,
    medium: panels.filter(p => p.currentFault.level === 'medium').length,
    low: panels.filter(p => p.currentFault.level === 'low').length,
    none: panels.filter(p => p.currentFault.level === 'none').length,
  };
  
  doc.setFontSize(12);
  doc.text('Summary', 14, 35);
  doc.text(`Total Panels: ${panels.length}`, 14, 45);
  doc.text(`No Faults: ${faultCounts.none}`, 14, 55);
  doc.text(`Low Faults: ${faultCounts.low}`, 14, 65);
  doc.text(`Medium Faults: ${faultCounts.medium}`, 14, 75);
  doc.text(`High Faults: ${faultCounts.high}`, 14, 85);
  
  // Panel List
  const panelsWithFaults = panels.filter(p => p.currentFault.level !== 'none');
  
  if (panelsWithFaults.length > 0) {
    doc.text('Panels With Faults', 14, 100);
    
    const panelData = panelsWithFaults.map(panel => [
      panel.id,
      panel.position.row + ',' + panel.position.column,
      panel.currentFault.level,
      panel.currentFault.description,
      formatDate(panel.lastInspection),
      panel.maintenanceSuggestion
    ]);
    
    autoTable(doc, {
      startY: 105,
      head: [['Panel ID', 'Position', 'Fault Level', 'Description', 'Last Inspection', 'Maintenance']],
      body: panelData,
      theme: 'grid',
      styles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: 20 }, 5: { cellWidth: 50 } },
    });
  } else {
    doc.text('No panels with faults found.', 14, 100);
  }
  
  // Footer
  const today = new Date();
  doc.setFontSize(10);
  doc.text(`Report generated on ${today.toLocaleDateString()}`, 14, 200);
  
  // Save the PDF
  doc.save('Solar_Panel_Grid_Report.pdf');
};