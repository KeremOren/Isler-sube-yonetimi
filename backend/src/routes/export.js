const express = require('express');
const PDFDocument = require('pdfkit');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const analyticsService = require('../services/analytics');

const router = express.Router();


function toASCII(text) {
    if (!text) return '';
    return String(text)
        .replace(/İ/g, 'I').replace(/ı/g, 'i')
        .replace(/Ş/g, 'S').replace(/ş/g, 's')
        .replace(/Ğ/g, 'G').replace(/ğ/g, 'g')
        .replace(/Ü/g, 'U').replace(/ü/g, 'u')
        .replace(/Ö/g, 'O').replace(/ö/g, 'o')
        .replace(/Ç/g, 'C').replace(/ç/g, 'c');
}

function formatMoney(val) {
    return (val || 0).toLocaleString('tr-TR');
}


router.get('/pdf', authenticate, async (req, res) => {
    try {
        const { year } = req.query;
        const targetYear = year || new Date().getFullYear();

        let kpis = { totalRevenue: 0, totalExpenses: 0, netProfit: 0, margin: '0' };
        let riskData = { closureCandidates: [], branches: [] };
        let margins = [];

        try { kpis = await analyticsService.getKPIs(targetYear, {}); } catch (e) { }
        try { riskData = await analyticsService.getRiskAnalysis(); } catch (e) { }
        try { margins = await analyticsService.getMarginByBranch(targetYear, {}); } catch (e) { }

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=isler-kitabevi-rapor-${targetYear}.pdf`);
        doc.pipe(res);

        
        doc.rect(0, 0, 595, 80).fill('#1e40af');
        doc.fillColor('#ffffff').fontSize(26).font('Helvetica-Bold');
        doc.text('ISLER KITABEVI', 0, 20, { width: 595, align: 'center' });
        doc.fontSize(12).font('Helvetica');
        doc.text('Yonetici Ozet Raporu - ' + targetYear, 0, 50, { width: 595, align: 'center' });

        doc.fillColor('#000000');
        doc.x = 50;
        doc.y = 100;

        
        doc.fontSize(9).text('Rapor Tarihi: ' + new Date().toLocaleDateString('tr-TR'), { align: 'right' });
        doc.moveDown(1.5);

        
        const boxY = doc.y;
        doc.rect(50, boxY, 495, 100).fillAndStroke('#f0f9ff', '#3b82f6');

        doc.fillColor('#1e40af').fontSize(12).font('Helvetica-Bold');
        doc.text('YONETICI OZETI', 60, boxY + 10);

        doc.fillColor('#000000').fontSize(10).font('Helvetica');
        doc.text('Toplam Gelir: ' + formatMoney(kpis.totalRevenue) + ' TL', 60, boxY + 30);
        doc.text('Toplam Gider: ' + formatMoney(kpis.totalExpenses) + ' TL', 60, boxY + 45);

        const profit = kpis.netProfit || 0;
        doc.fillColor(profit >= 0 ? '#16a34a' : '#dc2626');
        doc.text('Net Kar/Zarar: ' + formatMoney(profit) + ' TL', 60, boxY + 60);
        doc.fillColor('#000000');
        doc.text('Ortalama Marj: %' + (kpis.margin || 0), 60, boxY + 75);

        
        if (kpis.bestBranch) {
            doc.fillColor('#16a34a');
            doc.text('En Iyi: ' + toASCII(kpis.bestBranch.name || ''), 320, boxY + 30);
        }
        if (kpis.worstBranch) {
            doc.fillColor('#dc2626');
            doc.text('En Dusuk: ' + toASCII(kpis.worstBranch.name || ''), 320, boxY + 45);
        }
        doc.fillColor('#000000');

        doc.x = 50;
        doc.y = boxY + 115;

        
        doc.fillColor('#1e40af').fontSize(12).font('Helvetica-Bold');
        doc.text('SUBE PERFORMANS TABLOSU');
        doc.moveDown(0.5);

        if (margins && margins.length > 0) {
            
            const tableY = doc.y;
            doc.rect(50, tableY, 495, 18).fill('#e5e7eb');
            doc.fillColor('#000000').fontSize(8).font('Helvetica-Bold');
            doc.text('SUBE', 55, tableY + 4);
            doc.text('ILCE', 140, tableY + 4);
            doc.text('GELIR', 220, tableY + 4);
            doc.text('GIDER', 300, tableY + 4);
            doc.text('KAR', 380, tableY + 4);
            doc.text('MARJ', 460, tableY + 4);

            doc.font('Helvetica').fontSize(8);
            let rowY = tableY + 22;

            margins.slice(0, 10).forEach((b, i) => {
                
                if (i % 2 === 0) {
                    doc.rect(50, rowY - 2, 495, 16).fill('#f9fafb');
                }

                doc.fillColor('#000000');
                doc.text(toASCII(b.name || '').substring(0, 12), 55, rowY);
                doc.text(toASCII(b.district || '').substring(0, 10), 140, rowY);
                doc.text(formatMoney(b.revenue || 0), 220, rowY);
                doc.text(formatMoney(b.expenses || 0), 300, rowY);

                const bProfit = b.profit || 0;
                doc.fillColor(bProfit >= 0 ? '#16a34a' : '#dc2626');
                doc.text(formatMoney(bProfit), 380, rowY);
                doc.fillColor('#000000');
                doc.text('%' + (b.margin || 0), 460, rowY);

                rowY += 16;
            });

            doc.y = rowY + 10;
        }

        doc.x = 50;
        doc.moveDown(1);

        // ===== RISK KUTUSU =====
        const riskY = doc.y;
        doc.rect(50, riskY, 495, 80).fillAndStroke('#fef2f2', '#ef4444');

        doc.fillColor('#dc2626').fontSize(12).font('Helvetica-Bold');
        doc.text('RISK ANALIZI', 60, riskY + 10);

        const closureCandidates = riskData.closureCandidates || [];
        const branches = riskData.branches || [];
        const high = closureCandidates.length;
        const med = branches.filter(b => b.riskScore >= 40 && b.riskScore < 70).length;
        const low = branches.filter(b => b.riskScore < 40).length;

        doc.fillColor('#000000').fontSize(10).font('Helvetica');
        doc.text('Yuksek Riskli: ' + high + ' | Orta Riskli: ' + med + ' | Dusuk Riskli: ' + low, 60, riskY + 30);

        if (high > 0) {
            doc.fillColor('#dc2626');
            doc.text('Dikkat: ' + closureCandidates.map(b => toASCII(b.name)).join(', '), 60, riskY + 50);
        } else {
            doc.fillColor('#16a34a');
            doc.text('Yuksek risk grubunda sube bulunmuyor.', 60, riskY + 50);
        }

        doc.x = 50;
        doc.y = riskY + 95;

        
        doc.fillColor('#1e40af').fontSize(12).font('Helvetica-Bold');
        doc.text('ONERILER');
        doc.moveDown(0.5);

        doc.fillColor('#000000').fontSize(10).font('Helvetica');
        doc.text('1. Yuksek riskli subeler icin maliyet optimizasyonu yapilmali.');
        doc.text('2. Firsat skoru yuksek ilcelerde yeni sube potansiyeli degerlendirilmeli.');
        doc.text('3. En iyi performans gosteren subelerin basari faktorleri analiz edilmeli.');
        doc.text('4. Online siparis ve dijital kanallar guclendirilmeli.');

        
        doc.fontSize(8).fillColor('#6b7280');
        doc.text('Bu rapor Isler Kitabevi Karar Destek Sistemi tarafindan otomatik olusturulmustur.', 50, 780, { width: 495, align: 'center' });

        doc.end();

    } catch (error) {
        console.error('PDF export error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'PDF olusturulamadi: ' + error.message });
        }
    }
});


router.get('/csv', authenticate, async (req, res) => {
    try {
        const { type, year, branch_id } = req.query;
        const targetYear = year || new Date().getFullYear();

        let data = [];
        let filename = '';
        let headers = [];

        switch (type) {
            case 'sales':
                filename = `satis-verileri-${targetYear}.csv`;
                headers = ['Ay', 'Sube', 'Ilce', 'Kategori', 'Adet', 'Gelir'];
                let salesQuery = `SELECT DATE_FORMAT(s.date, '%Y-%m') as month, b.name as branch_name, b.district, s.category, SUM(s.quantity) as quantity, SUM(s.revenue) as revenue FROM sales s JOIN branches b ON s.branch_id = b.id WHERE YEAR(s.date) = ?`;
                const salesParams = [targetYear];
                if (branch_id) { salesQuery += ' AND s.branch_id = ?'; salesParams.push(branch_id); }
                salesQuery += ' GROUP BY DATE_FORMAT(s.date, \'%Y-%m\'), b.id, b.name, b.district, s.category ORDER BY month, branch_name';
                const [salesRows] = await db.execute(salesQuery, salesParams);
                data = salesRows.map(r => [r.month, r.branch_name, r.district, r.category, r.quantity, r.revenue]);
                break;

            case 'expenses':
                filename = `gider-verileri-${targetYear}.csv`;
                headers = ['Ay', 'Sube', 'Ilce', 'Gider Turu', 'Tutar'];
                let expenseQuery = `SELECT DATE_FORMAT(e.date, '%Y-%m') as month, b.name as branch_name, b.district, e.expense_type, SUM(e.amount) as amount FROM expenses e JOIN branches b ON e.branch_id = b.id WHERE YEAR(e.date) = ?`;
                const expenseParams = [targetYear];
                if (branch_id) { expenseQuery += ' AND e.branch_id = ?'; expenseParams.push(branch_id); }
                expenseQuery += ' GROUP BY DATE_FORMAT(e.date, \'%Y-%m\'), b.id, b.name, b.district, e.expense_type ORDER BY month, branch_name';
                const [expenseRows] = await db.execute(expenseQuery, expenseParams);
                data = expenseRows.map(r => [r.month, r.branch_name, r.district, r.expense_type, r.amount]);
                break;

            case 'summary':
                filename = `ozet-rapor-${targetYear}.csv`;
                headers = ['Sube', 'Ilce', 'Toplam Gelir', 'Toplam Gider', 'Kar/Zarar', 'Marj (%)'];
                const margins = await analyticsService.getMarginByBranch(targetYear, {});
                data = margins.map(m => [m.name, m.district, m.revenue, m.expenses, m.profit, m.margin]);
                break;

            case 'risk':
                filename = `risk-analizi-${targetYear}.csv`;
                headers = ['Sube', 'Ilce', 'Risk Skoru', 'Risk Seviyesi'];
                const riskData = await analyticsService.getRiskAnalysis();
                data = (riskData.branches || []).map(r => [r.name, r.district, r.riskScore, r.riskLevel]);
                break;

            default:
                return res.status(400).json({ error: 'Gecersiz export turu.' });
        }

        const BOM = '\uFEFF';
        let csv = BOM + headers.join(';') + '\n';
        data.forEach(row => {
            csv += row.map(cell => (typeof cell === 'string' && cell.includes(';')) ? `"${cell}"` : cell).join(';') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(csv);

    } catch (error) {
        console.error('CSV export error:', error);
        res.status(500).json({ error: 'CSV olusturulamadi: ' + error.message });
    }
});

module.exports = router;
