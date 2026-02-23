const PDFDocument = require('pdfkit');
const Participant = require('../models/Participant');
const Deposit = require('../models/Deposit');
const AftaarEntry = require('../models/AftaarEntry');

const generatePDFReport = async (req, res) => {
  let doc;
  try {
    const participants = await Participant.find().sort({ name: 1 });
    const deposits = await Deposit.find()
      .populate('participant', 'name')
      .sort({ date: -1 });
    const entries = await AftaarEntry.find()
      .populate('participants.participant', 'name')
      .sort({ date: -1 });

    const totalDeposits = participants.reduce((sum, p) => sum + p.totalDeposited, 0);
    const totalExpenses = participants.reduce((sum, p) => sum + p.totalExpense, 0);
    const totalBalance = totalDeposits - totalExpenses;

    doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });

    doc.on('error', (err) => {
      console.error('PDF stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error generating PDF.' });
      }
    });

    res.on('close', () => {
      if (doc && !doc.closed) {
        doc.end();
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=aftaar-report.pdf');
    doc.pipe(res);

    const primaryColor = '#1e3a5f';
    const grayColor = '#666666';
    const pageWidth = doc.page.width - 80;

    doc.fontSize(22).fillColor(primaryColor).text('Aftaar Manager', { align: 'center' });
    doc.fontSize(10).fillColor(grayColor).text('Expense Tracking Report', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor(grayColor).text(
      `Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      { align: 'center' }
    );
    doc.moveDown(0.5);

    doc.strokeColor(primaryColor).lineWidth(1)
      .moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke();
    doc.moveDown(1);

    doc.fontSize(14).fillColor(primaryColor).text('Summary');
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#333333');

    const summaryData = [
      [`Total Participants: ${participants.length}`, `Total Aftaar Days: ${entries.length}`],
      [`Total Deposits: Rs ${totalDeposits.toLocaleString()}`, `Total Expenses: Rs ${totalExpenses.toLocaleString()}`],
      [`Net Balance: Rs ${totalBalance.toLocaleString()}`],
    ];
    summaryData.forEach(row => {
      const y = doc.y;
      doc.text(row[0], 40, y);
      if (row[1]) doc.text(row[1], 300, y);
      doc.moveDown(0.3);
    });
    doc.moveDown(1);

    if (participants.length > 0) {
      doc.fontSize(14).fillColor(primaryColor).text('Participant Details');
      doc.moveDown(0.5);

      const cols = [
        { label: '#', width: 30, align: 'left' },
        { label: 'Name', width: 160, align: 'left' },
        { label: 'Deposited', width: 100, align: 'right' },
        { label: 'Expense', width: 100, align: 'right' },
        { label: 'Balance', width: 100, align: 'right' },
      ];

      drawTableHeader(doc, cols, 40, primaryColor);

      participants.forEach((p, i) => {
        if (doc.y > doc.page.height - 80) {
          doc.addPage();
          drawTableHeader(doc, cols, 40, primaryColor);
        }
        const rowY = doc.y;
        const rowData = [
          String(i + 1),
          p.name,
          `Rs ${p.totalDeposited.toLocaleString()}`,
          `Rs ${p.totalExpense.toLocaleString()}`,
          `Rs ${p.remainingBalance.toLocaleString()}`,
        ];
        drawTableRow(doc, cols, rowData, 40, i % 2 === 0 ? '#f8f9fa' : '#ffffff');
      });
      doc.moveDown(1);
    }

    if (entries.length > 0) {
      if (doc.y > doc.page.height - 120) doc.addPage();

      doc.fontSize(14).fillColor(primaryColor).text('Aftaar Entries');
      doc.moveDown(0.5);

      const entryCols = [
        { label: '#', width: 30, align: 'left' },
        { label: 'Date', width: 100, align: 'left' },
        { label: 'Total Bill', width: 90, align: 'right' },
        { label: 'Per Person', width: 90, align: 'right' },
        { label: 'Participants', width: 180, align: 'left' },
      ];

      drawTableHeader(doc, entryCols, 40, primaryColor);

      entries.forEach((e, i) => {
        if (doc.y > doc.page.height - 80) {
          doc.addPage();
          drawTableHeader(doc, entryCols, 40, primaryColor);
        }
        const names = e.participants.map(p => p.participant?.name || '?').join(', ');
        const truncNames = names.length > 35 ? names.substring(0, 32) + '...' : names;
        const rowData = [
          String(i + 1),
          new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          `Rs ${e.totalBill.toLocaleString()}`,
          `Rs ${e.perPersonShare.toLocaleString()}`,
          truncNames,
        ];
        drawTableRow(doc, entryCols, rowData, 40, i % 2 === 0 ? '#f8f9fa' : '#ffffff');
      });
      doc.moveDown(1);
    }

    if (deposits.length > 0) {
      if (doc.y > doc.page.height - 120) doc.addPage();

      doc.fontSize(14).fillColor(primaryColor).text('Deposit History');
      doc.moveDown(0.5);

      const depCols = [
        { label: '#', width: 30, align: 'left' },
        { label: 'Participant', width: 140, align: 'left' },
        { label: 'Date', width: 110, align: 'left' },
        { label: 'Amount', width: 100, align: 'right' },
        { label: 'Note', width: 110, align: 'left' },
      ];

      drawTableHeader(doc, depCols, 40, primaryColor);

      deposits.forEach((d, i) => {
        if (doc.y > doc.page.height - 80) {
          doc.addPage();
          drawTableHeader(doc, depCols, 40, primaryColor);
        }
        const note = d.note ? (d.note.length > 20 ? d.note.substring(0, 17) + '...' : d.note) : '-';
        const rowData = [
          String(i + 1),
          d.participant?.name || 'Unknown',
          new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          `Rs ${d.amount.toLocaleString()}`,
          note,
        ];
        drawTableRow(doc, depCols, rowData, 40, i % 2 === 0 ? '#f8f9fa' : '#ffffff');
      });
    }

    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('#999999')
        .text(`Page ${i + 1} of ${pages.count}`, 40, doc.page.height - 40, { align: 'center', width: pageWidth });
    }

    doc.end();
  } catch (error) {
    console.error('PDF generation error:', error);
    if (doc && !doc.closed) {
      try { doc.end(); } catch (e) {}
    }
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error generating PDF report.' });
    } else {
      res.end();
    }
  }
};

function drawTableHeader(doc, cols, startX, color) {
  const rowHeight = 22;
  let x = startX;

  doc.rect(startX, doc.y, cols.reduce((s, c) => s + c.width, 0), rowHeight)
    .fill(color);

  const headerY = doc.y + 6;
  cols.forEach(col => {
    const textX = col.align === 'right' ? x + col.width - 5 : x + 5;
    doc.fontSize(9).fillColor('#ffffff')
      .text(col.label, textX, headerY, {
        width: col.width - 10,
        align: col.align,
        lineBreak: false,
      });
    x += col.width;
  });
  doc.y = doc.y + rowHeight;
}

function drawTableRow(doc, cols, data, startX, bgColor) {
  const rowHeight = 20;
  let x = startX;

  doc.rect(startX, doc.y, cols.reduce((s, c) => s + c.width, 0), rowHeight)
    .fill(bgColor);

  const rowY = doc.y + 5;
  cols.forEach((col, idx) => {
    const textX = col.align === 'right' ? x + col.width - 5 : x + 5;
    doc.fontSize(8).fillColor('#333333')
      .text(data[idx] || '', textX, rowY, {
        width: col.width - 10,
        align: col.align,
        lineBreak: false,
      });
    x += col.width;
  });
  doc.y = doc.y + rowHeight;
}

module.exports = { generatePDFReport };
