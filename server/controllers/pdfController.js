const PDFDocument = require('pdfkit');
const Participant = require('../models/Participant');
const Deposit = require('../models/Deposit');
const AftaarEntry = require('../models/AftaarEntry');

const COLORS = {
  primary: '#1a3a5c',
  secondary: '#2d6a9f',
  accent: '#e8f0fe',
  headerBg: '#1a3a5c',
  headerText: '#ffffff',
  rowEven: '#f7f9fc',
  rowOdd: '#ffffff',
  text: '#2c3e50',
  textLight: '#6b7c93',
  border: '#d1dbe6',
  positive: '#27774a',
  negative: '#c0392b',
  summaryBg: '#f0f4f8',
};

const MARGIN = 50;
const PAGE_BOTTOM = 780;

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

    doc = new PDFDocument({
      margin: MARGIN,
      size: 'A4',
      bufferPages: true,
      info: {
        Title: 'Aftaar Manager - Expense Report',
        Author: 'Aftaar Manager',
      },
    });

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

    const contentWidth = doc.page.width - MARGIN * 2;

    drawHeader(doc, contentWidth);
    drawSummaryCards(doc, contentWidth, {
      participants: participants.length,
      aftaarDays: entries.length,
      totalDeposits,
      totalExpenses,
      totalBalance,
    });

    if (participants.length > 0) {
      drawSectionTitle(doc, 'Participant Details');

      const pCols = [
        { label: '#', width: 35, align: 'center' },
        { label: 'Name', width: 150, align: 'left' },
        { label: 'Deposited', width: 105, align: 'right' },
        { label: 'Expense', width: 105, align: 'right' },
        { label: 'Balance', width: 100, align: 'right' },
      ];

      drawTableHeader(doc, pCols, MARGIN);

      participants.forEach((p, i) => {
        checkPageBreak(doc, pCols);
        const bal = p.remainingBalance;
        const balColor = bal >= 0 ? COLORS.positive : COLORS.negative;
        const name = truncateText(p.name, 24);
        drawTableRow(doc, pCols, [
          String(i + 1),
          name,
          formatCurrency(p.totalDeposited),
          formatCurrency(p.totalExpense),
          { text: formatCurrency(bal), color: balColor },
        ], i);
      });

      drawTableBottom(doc, pCols, MARGIN);
      doc.moveDown(1.5);
    }

    if (entries.length > 0) {
      ensureSpace(doc, 100);
      drawSectionTitle(doc, 'Aftaar Entries');

      const eCols = [
        { label: '#', width: 35, align: 'center' },
        { label: 'Date', width: 100, align: 'left' },
        { label: 'Total Bill', width: 90, align: 'right' },
        { label: 'Per Person', width: 85, align: 'right' },
        { label: 'Participants', width: 185, align: 'left' },
      ];

      drawTableHeader(doc, eCols, MARGIN);

      entries.forEach((e, i) => {
        checkPageBreak(doc, eCols);
        const names = e.participants.map(p => p.participant?.name || '?').join(', ');
        const displayNames = names.length > 40 ? names.substring(0, 37) + '...' : names;
        drawTableRow(doc, eCols, [
          String(i + 1),
          formatDate(e.date),
          formatCurrency(e.totalBill),
          formatCurrency(e.perPersonShare),
          displayNames,
        ], i);
      });

      drawTableBottom(doc, eCols, MARGIN);
      doc.moveDown(1.5);
    }

    if (deposits.length > 0) {
      ensureSpace(doc, 100);
      drawSectionTitle(doc, 'Deposit History');

      const dCols = [
        { label: '#', width: 35, align: 'center' },
        { label: 'Participant', width: 140, align: 'left' },
        { label: 'Date', width: 100, align: 'left' },
        { label: 'Amount', width: 105, align: 'right' },
        { label: 'Note', width: 115, align: 'left' },
      ];

      drawTableHeader(doc, dCols, MARGIN);

      deposits.forEach((d, i) => {
        checkPageBreak(doc, dCols);
        const note = d.note ? (d.note.length > 22 ? d.note.substring(0, 19) + '...' : d.note) : '-';
        drawTableRow(doc, dCols, [
          String(i + 1),
          truncateText(d.participant?.name || 'Unknown', 22),
          formatDate(d.date),
          formatCurrency(d.amount),
          note,
        ], i);
      });

      drawTableBottom(doc, dCols, MARGIN);
    }

    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.save();
      doc.fontSize(8).fillColor(COLORS.textLight);
      const footerY = doc.page.height - 35;
      doc.text(`Aftaar Manager`, MARGIN, footerY, { width: contentWidth / 2, align: 'left' });
      doc.text(`Page ${i + 1} of ${pages.count}`, MARGIN + contentWidth / 2, footerY, { width: contentWidth / 2, align: 'right' });
      doc.restore();
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

function truncateText(text, maxLen) {
  if (!text) return '';
  return text.length > maxLen ? text.substring(0, maxLen - 3) + '...' : text;
}

function formatCurrency(amount) {
  return `Rs ${Number(amount).toLocaleString('en-IN')}`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function drawHeader(doc, contentWidth) {
  const startY = doc.y;
  doc.save();
  doc.rect(0, 0, doc.page.width, 100).fill(COLORS.primary);
  doc.fontSize(24).fillColor('#ffffff').text('Aftaar Manager', MARGIN, 28, {
    width: contentWidth,
    align: 'center',
  });
  doc.fontSize(11).fillColor('#c8d8e8').text('Expense Tracking Report', MARGIN, 58, {
    width: contentWidth,
    align: 'center',
  });
  doc.fontSize(9).fillColor('#a0b8d0').text(
    `Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    MARGIN, 76, { width: contentWidth, align: 'center' }
  );
  doc.restore();
  doc.y = 120;
}

function drawSummaryCards(doc, contentWidth, data) {
  const cardWidth = (contentWidth - 20) / 3;
  const cardHeight = 60;
  const startX = MARGIN;
  const startY = doc.y;

  const cards = [
    { label: 'Total Deposits', value: formatCurrency(data.totalDeposits), color: COLORS.secondary },
    { label: 'Total Expenses', value: formatCurrency(data.totalExpenses), color: COLORS.negative },
    { label: 'Net Balance', value: formatCurrency(data.totalBalance), color: data.totalBalance >= 0 ? COLORS.positive : COLORS.negative },
  ];

  cards.forEach((card, i) => {
    const x = startX + i * (cardWidth + 10);
    doc.save();
    doc.roundedRect(x, startY, cardWidth, cardHeight, 6).fill(COLORS.summaryBg);
    doc.roundedRect(x, startY, 4, cardHeight, 2).fill(card.color);
    doc.fontSize(9).fillColor(COLORS.textLight).text(card.label, x + 14, startY + 12, {
      width: cardWidth - 24,
      lineBreak: false,
    });
    doc.fontSize(14).fillColor(card.color).text(card.value, x + 14, startY + 30, {
      width: cardWidth - 24,
      lineBreak: false,
    });
    doc.restore();
  });

  doc.y = startY + cardHeight + 10;

  const infoY = doc.y;
  doc.save();
  doc.roundedRect(startX, infoY, contentWidth, 28, 4).fill(COLORS.accent);
  doc.fontSize(9).fillColor(COLORS.text);
  doc.text(`Participants: ${data.participants}`, startX + 15, infoY + 8, { width: 140, lineBreak: false });
  doc.text(`Aftaar Days: ${data.aftaarDays}`, startX + 170, infoY + 8, { width: 140, lineBreak: false });
  doc.restore();

  doc.y = infoY + 42;
}

function drawSectionTitle(doc, title) {
  doc.save();
  doc.fontSize(13).fillColor(COLORS.primary).text(title, MARGIN, doc.y);
  doc.moveDown(0.15);
  doc.strokeColor(COLORS.secondary).lineWidth(2)
    .moveTo(MARGIN, doc.y).lineTo(MARGIN + 60, doc.y).stroke();
  doc.strokeColor(COLORS.border).lineWidth(0.5)
    .moveTo(MARGIN + 60, doc.y).lineTo(doc.page.width - MARGIN, doc.y).stroke();
  doc.restore();
  doc.moveDown(0.6);
}

function drawTableHeader(doc, cols, startX) {
  const totalWidth = cols.reduce((s, c) => s + c.width, 0);
  const rowHeight = 26;
  const y = doc.y;

  doc.save();
  roundedTop(doc, startX, y, totalWidth, rowHeight, 4);
  doc.fill(COLORS.headerBg);

  let x = startX;
  cols.forEach(col => {
    const padding = 8;
    let textX = x + padding;
    let textW = col.width - padding * 2;
    doc.fontSize(9).fillColor(COLORS.headerText)
      .text(col.label, textX, y + 8, {
        width: textW,
        align: col.align,
        lineBreak: false,
      });
    x += col.width;
  });
  doc.restore();
  doc.y = y + rowHeight;
}

function drawTableRow(doc, cols, data, startX, rowIndex) {
  const totalWidth = cols.reduce((s, c) => s + c.width, 0);
  const rowHeight = 24;
  const y = doc.y;
  const bgColor = rowIndex % 2 === 0 ? COLORS.rowEven : COLORS.rowOdd;

  doc.save();
  doc.rect(startX, y, totalWidth, rowHeight).fill(bgColor);
  doc.strokeColor(COLORS.border).lineWidth(0.3)
    .moveTo(startX, y + rowHeight).lineTo(startX + totalWidth, y + rowHeight).stroke();

  let x = startX;
  cols.forEach((col, idx) => {
    const padding = 8;
    let textX = x + padding;
    let textW = col.width - padding * 2;

    const cellData = data[idx];
    let text, color;
    if (typeof cellData === 'object' && cellData !== null && cellData.text) {
      text = cellData.text;
      color = cellData.color;
    } else {
      text = String(cellData || '');
      color = COLORS.text;
    }

    doc.fontSize(8.5).fillColor(color)
      .text(text, textX, y + 7, {
        width: textW,
        align: col.align,
        lineBreak: false,
      });
    x += col.width;
  });
  doc.restore();
  doc.y = y + rowHeight;
}

function drawTableBottom(doc, cols, startX) {
  const totalWidth = cols.reduce((s, c) => s + c.width, 0);
  doc.save();
  doc.strokeColor(COLORS.border).lineWidth(0.5);
  const y = doc.y;
  doc.moveTo(startX, y).lineTo(startX + totalWidth, y).stroke();
  doc.restore();
}

function roundedTop(doc, x, y, w, h, r) {
  doc.moveTo(x + r, y)
    .lineTo(x + w - r, y)
    .quadraticCurveTo(x + w, y, x + w, y + r)
    .lineTo(x + w, y + h)
    .lineTo(x, y + h)
    .lineTo(x, y + r)
    .quadraticCurveTo(x, y, x + r, y)
    .closePath();
}

function checkPageBreak(doc, cols) {
  const rowHeight = 24;
  const footerSpace = 50;
  if (doc.y + rowHeight > doc.page.height - footerSpace) {
    doc.addPage();
    drawTableHeader(doc, cols, MARGIN);
  }
}

function ensureSpace(doc, minSpace) {
  const footerSpace = 50;
  if (doc.y + minSpace > doc.page.height - footerSpace) {
    doc.addPage();
  }
}

module.exports = { generatePDFReport };
