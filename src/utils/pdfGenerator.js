import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const loadFont = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Font yüklenemedi: ${url}`);
    const buffer = await response.arrayBuffer();

    // Convert to Base64
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

export async function downloadConsumptionReport(data) {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Fetch and embed the Turkish-supported fonts (Tinos)
    try {
        const [regularFont, boldFont] = await Promise.all([
            loadFont('/Tinos-Regular.ttf'),
            loadFont('/Tinos-Bold.ttf')
        ]);

        doc.addFileToVFS('Tinos-Regular.ttf', regularFont);
        doc.addFont('Tinos-Regular.ttf', 'Tinos', 'normal');

        doc.addFileToVFS('Tinos-Bold.ttf', boldFont);
        doc.addFont('Tinos-Bold.ttf', 'Tinos', 'bold');

        doc.setFont('Tinos', 'normal');
    } catch (err) {
        console.warn('Font loading failed, falling back to standard Helvetica.', err);
    }

    const weekly = data.weeklyConsumption || [];
    // Sort from newest to oldest for the report (as requested)
    const sortedWeekly = [...weekly].reverse();

    // Calculate totals
    const totalWeight = weekly.reduce((sum, w) => sum + w.weight, 0);
    const totalPkgs = weekly.reduce((sum, w) => sum + w.packages, 0);

    const marginX = 14;
    let currentY = 20;

    // --- Header ---
    doc.setFont('Tinos', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text('SİLO YEM TÜKETİM RAPORU', marginX, currentY);

    doc.setFont('Tinos', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text('Otomatik oluşturulmuş geçmiş tüketim dökümü', marginX, currentY + 6);

    const reportDateStr = new Date().toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    doc.setFont('Tinos', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105); // Slate-600
    doc.text('RAPOR TARİHİ', 196, currentY, { align: 'right' });
    doc.setFont('Tinos', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(reportDateStr, 196, currentY + 5, { align: 'right' });

    // Header border line
    doc.setDrawColor(37, 99, 235); // Blue-600
    doc.setLineWidth(0.8);
    doc.line(marginX, currentY + 10, 196, currentY + 10);

    currentY += 22;

    // --- Stats Cards (Total Stocks & Consumption Summary) ---
    // Cards dimensions
    const cardW = 56;
    const cardH = 24;
    const cardGap = 7;
    const cards = [
        {
            title: 'MEVCUT TOPLAM STOK',
            main: `${data.stats?.totalStock || 0} Paket`,
            sub: `${data.stats?.totalWeight || 0} kg`
        },
        {
            title: 'TOPLAM TÜKETİM (GEÇMİŞ)',
            main: `${totalWeight} kg`,
            sub: `${totalPkgs} Paket`
        },
        {
            title: 'RAPORLANAN DÖNEM',
            main: `${weekly.length} Hafta`,
            sub: 'Tüm geçmiş kayıtlar'
        }
    ];

    cards.forEach((card, index) => {
        const x = marginX + index * (cardW + cardGap);
        
        // Draw card border & background
        doc.setFillColor(248, 250, 252); // Slate-50 background
        doc.setDrawColor(226, 232, 240); // Slate-200 border
        doc.setLineWidth(0.3);
        doc.roundedRect(x, currentY, cardW, cardH, 2, 2, 'FD');

        // Card Title
        doc.setFont('Tinos', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(card.title, x + 5, currentY + 6);

        // Card Main Metric
        doc.setFont('Tinos', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text(card.main, x + 5, currentY + 14);

        // Card Sub Metric
        doc.setFont('Tinos', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(card.sub, x + 5, currentY + 20);
    });

    currentY += cardH + 12;

    // --- Table section header ---
    doc.setFont('Tinos', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text('Haftalık Tüketim Detayları', marginX, currentY);

    currentY += 6;

    // --- Data Table (Selectable & Non-clipping via autoTable) ---
    const tableColumn = ['Dönem', 'Tarih Aralığı', 'Tüketilen Miktar', 'Paket Sayısı'];
    const tableRows = sortedWeekly.map(w => [
        w.weekLabel,
        w.dateRangeLabel,
        `${w.weight} kg`,
        `${w.packages} Paket`
    ]);

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: currentY,
        theme: 'striped',
        styles: {
            font: 'Tinos',
            fontSize: 9.5,
            cellPadding: 3.5,
            textColor: [30, 41, 59] // Slate-800
        },
        headStyles: {
            fillColor: [37, 99, 235], // Blue-600
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'left'
        },
        columnStyles: {
            0: { halign: 'left', fontStyle: 'bold', cellWidth: 35 },
            1: { halign: 'left', cellWidth: 55 },
            2: { halign: 'right', fontStyle: 'bold', textColor: [37, 99, 235], cellWidth: 46 }, // Blue-600 highlight
            3: { halign: 'right', cellWidth: 46 }
        },
        didDrawPage: (data) => {
            // Footer on each page
            doc.setFont('Tinos', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184); // Slate-400
            doc.text(
                'Bu rapor Silo Yönetim Sistemi tarafından otomatik olarak oluşturulmuştur.',
                105,
                285,
                { align: 'center' }
            );
        }
    });

    // Save PDF file (triggers direct browser download)
    const dateStamp = new Date().toISOString().split('T')[0];
    doc.save(`silo-yem-tuketim-raporu-${dateStamp}.pdf`);
}
