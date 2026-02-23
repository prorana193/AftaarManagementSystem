import { formatCurrency, formatDate } from './formatters';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export async function generateReport(report) {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js');
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.4/jspdf.plugin.autotable.min.js');

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(20);
  doc.setTextColor(30, 58, 95);
  doc.text('Aftaar Manager', pageWidth / 2, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Expense Tracking Report', pageWidth / 2, 27, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleDateString('en-PK', { dateStyle: 'long' })}`, pageWidth / 2, 33, { align: 'center' });

  doc.setDrawColor(30, 58, 95);
  doc.line(14, 37, pageWidth - 14, 37);

  let y = 45;
  doc.setFontSize(12);
  doc.setTextColor(30, 58, 95);
  doc.text('Summary', 14, y);
  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(60);
  doc.text(`Total Participants: ${report.summary.totalParticipants}`, 14, y);
  doc.text(`Total Aftaar Days: ${report.summary.totalAftaarDays}`, 100, y);
  y += 6;
  doc.text(`Total Deposits: ${formatCurrency(report.summary.totalDeposits)}`, 14, y);
  doc.text(`Total Expenses: ${formatCurrency(report.summary.totalExpenses)}`, 100, y);
  y += 6;
  doc.text(`Net Balance: ${formatCurrency(report.summary.totalBalance)}`, 14, y);
  y += 12;

  doc.setFontSize(12);
  doc.setTextColor(30, 58, 95);
  doc.text('Participant Details', 14, y);
  y += 4;

  doc.autoTable({
    startY: y,
    head: [['#', 'Name', 'Deposited', 'Expense', 'Balance']],
    body: report.participants.map((p, i) => [
      i + 1,
      p.name,
      formatCurrency(p.totalDeposited),
      formatCurrency(p.totalExpense),
      formatCurrency(p.remainingBalance),
    ]),
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 95], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 10 },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
    },
  });

  if (report.aftaarEntries.length > 0) {
    y = doc.lastAutoTable.finalY + 12;
    if (y > 250) { doc.addPage(); y = 20; }

    doc.setFontSize(12);
    doc.setTextColor(30, 58, 95);
    doc.text('Aftaar Entries', 14, y);
    y += 4;

    doc.autoTable({
      startY: y,
      head: [['#', 'Date', 'Total Bill', 'Per Person', 'Participants']],
      body: report.aftaarEntries.map((e, i) => [
        i + 1,
        formatDate(e.date),
        formatCurrency(e.totalBill),
        formatCurrency(e.perPersonShare),
        e.participants.map((p) => p.participant?.name || 'Unknown').join(', '),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 95], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 10 },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { cellWidth: 60 },
      },
    });
  }

  if (report.deposits.length > 0) {
    y = doc.lastAutoTable.finalY + 12;
    if (y > 250) { doc.addPage(); y = 20; }

    doc.setFontSize(12);
    doc.setTextColor(30, 58, 95);
    doc.text('Deposit History', 14, y);
    y += 4;

    doc.autoTable({
      startY: y,
      head: [['#', 'Participant', 'Date', 'Amount', 'Note']],
      body: report.deposits.map((d, i) => [
        i + 1,
        d.participant?.name || 'Unknown',
        formatDate(d.date),
        formatCurrency(d.amount),
        d.note || '-',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 95], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 10 },
        3: { halign: 'right' },
      },
    });
  }

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }

  doc.save('aftaar-report.pdf');
}
