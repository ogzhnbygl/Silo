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

function formatProductCell(prodData) {
    if (!prodData || !prodData.weight) return '-';
    return `${prodData.weight} kg (${prodData.packages} Pkt)`;
}

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
    // Sort from newest to oldest for the report
    const sortedWeekly = [...weekly].reverse();

    // Calculate totals
    const totalWeight = weekly.reduce((sum, w) => sum + (w.weight || 0), 0);
    const totalPkgs = weekly.reduce((sum, w) => sum + (w.packages || 0), 0);
    const totalA03Weight = weekly.reduce((sum, w) => sum + (w.byProduct?.A03?.weight || 0), 0);
    const totalA04Weight = weekly.reduce((sum, w) => sum + (w.byProduct?.A04?.weight || 0), 0);
    const totalOptimaWeight = weekly.reduce((sum, w) => sum + (w.byProduct?.OPTIMA?.weight || 0), 0);
    const hasOptima = totalOptimaWeight > 0;

    const a03Stats = data.stats?.products?.A03 || { totalStock: 0, totalWeight: 0 };
    const a04Stats = data.stats?.products?.A04 || { totalStock: 0, totalWeight: 0 };

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
    doc.text('SAFE® A03 & SAFE® A04 stok ve geçmiş tüketim dökümü', marginX, currentY + 6);

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

    // --- Stats Cards (SAFE A03, SAFE A04 & Total Consumption Summary) ---
    const cardW = 56;
    const cardH = 25;
    const cardGap = 7;
    const consumptionSub = hasOptima
        ? `A03: ${totalA03Weight}kg | A04: ${totalA04Weight}kg | Eski: ${totalOptimaWeight}kg`
        : `A03: ${totalA03Weight} kg | A04: ${totalA04Weight} kg (${weekly.length} Hft)`;

    const cards = [
        {
            title: 'SAFE® A03 MEVCUT STOK',
            main: `${a03Stats.totalStock} Paket (${a03Stats.totalWeight} kg)`,
            sub: `Üreme & Büyüme • ${a03Stats.totalStock > 10 ? 'Optimal Seviye' : 'Stok Az (≤10 Pkt)'}`
        },
        {
            title: 'SAFE® A04 MEVCUT STOK',
            main: `${a04Stats.totalStock} Paket (${a04Stats.totalWeight} kg)`,
            sub: `Bakım & İdame • ${a04Stats.totalStock > 10 ? 'Optimal Seviye' : 'Stok Az (≤10 Pkt)'}`
        },
        {
            title: 'TOPLAM TÜKETİM (GEÇMİŞ)',
            main: `${totalWeight} kg (${totalPkgs} Pkt)`,
            sub: consumptionSub
        }
    ];

    cards.forEach((card, index) => {
        const x = marginX + index * (cardW + cardGap);

        doc.setFillColor(248, 250, 252); // Slate-50 background
        doc.setDrawColor(226, 232, 240); // Slate-200 border
        doc.setLineWidth(0.3);
        doc.roundedRect(x, currentY, cardW, cardH, 2, 2, 'FD');

        doc.setFont('Tinos', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(card.title, x + 4, currentY + 6);

        doc.setFont('Tinos', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.text(card.main, x + 4, currentY + 14);

        doc.setFont('Tinos', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(card.sub, x + 4, currentY + 20.5);
    });

    currentY += cardH + 12;

    // --- Table section header ---
    doc.setFont('Tinos', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text('Haftalık Tüketim Detayları (Ürün Bazlı)', marginX, currentY);

    currentY += 6;

    // --- Data Table ---
    const tableColumn = hasOptima
        ? ['Dönem', 'Tarih Aralığı', 'SAFE® A03', 'SAFE® A04', 'Optima 4kg', 'Toplam']
        : ['Dönem', 'Tarih Aralığı', 'SAFE® A03 (10kg)', 'SAFE® A04 (10kg)', 'Toplam Tüketim'];

    const tableRows = sortedWeekly.map(w => {
        const a03Cell = formatProductCell(w.byProduct?.A03);
        const a04Cell = formatProductCell(w.byProduct?.A04);
        const totalCell = w.weight > 0 ? `${w.weight} kg (${w.packages} Pkt)` : '0 kg';

        if (hasOptima) {
            const optimaCell = formatProductCell(w.byProduct?.OPTIMA);
            return [w.weekLabel, w.dateRangeLabel, a03Cell, a04Cell, optimaCell, totalCell];
        }
        return [w.weekLabel, w.dateRangeLabel, a03Cell, a04Cell, totalCell];
    });

    const columnStyles = hasOptima
        ? {
              0: { halign: 'left', fontStyle: 'bold', cellWidth: 24 },
              1: { halign: 'left', cellWidth: 38 },
              2: { halign: 'right', textColor: [37, 99, 235], cellWidth: 30 },
              3: { halign: 'right', textColor: [124, 58, 237], cellWidth: 30 },
              4: { halign: 'right', textColor: [100, 116, 139], cellWidth: 28 },
              5: { halign: 'right', fontStyle: 'bold', textColor: [30, 41, 59], cellWidth: 32 }
          }
        : {
              0: { halign: 'left', fontStyle: 'bold', cellWidth: 28 },
              1: { halign: 'left', cellWidth: 44 },
              2: { halign: 'right', textColor: [37, 99, 235], cellWidth: 36 },
              3: { halign: 'right', textColor: [124, 58, 237], cellWidth: 36 },
              4: { halign: 'right', fontStyle: 'bold', textColor: [30, 41, 59], cellWidth: 38 }
          };

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: currentY,
        theme: 'striped',
        styles: {
            font: 'Tinos',
            fontSize: 9,
            cellPadding: 3.2,
            textColor: [30, 41, 59]
        },
        headStyles: {
            fillColor: [37, 99, 235],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'left'
        },
        columnStyles,
        didParseCell: (hookData) => {
            if (hookData.section === 'head' && hookData.column.index >= 2) {
                hookData.cell.styles.halign = 'right';
            }
        },
        didDrawPage: () => {
            doc.setFont('Tinos', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text(
                'Bu rapor Silo Yönetim Sistemi tarafından otomatik olarak oluşturulmuştur.',
                105,
                285,
                { align: 'center' }
            );
        }
    });

    const dateStamp = new Date().toISOString().split('T')[0];
    doc.save(`silo-yem-tuketim-raporu-${dateStamp}.pdf`);
}
