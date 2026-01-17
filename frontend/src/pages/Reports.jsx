import { useState } from 'react';
import { exportAPI } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';

export default function Reports() {
    const { can, isViewer } = usePermissions();
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);
    const [exportType, setExportType] = useState('summary');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handlePDFExport = async () => {
        if (!can('reports.export')) {
            setMessage('Bu işlem için yetkiniz yok.');
            return;
        }
        setLoading(true);
        setMessage('');

        try {
            const response = await exportAPI.getPDF({ year });

            // Create blob and download
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `isler-kitabevi-rapor-${year}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setMessage('PDF raporu başarıyla indirildi.');
        } catch (error) {
            setMessage('PDF oluşturulurken bir hata oluştu.');
            console.error('PDF export error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCSVExport = async () => {
        if (!can('reports.export')) {
            setMessage('Bu işlem için yetkiniz yok.');
            return;
        }
        setLoading(true);
        setMessage('');

        try {
            const response = await exportAPI.getCSV(exportType, { year });

            // Create blob and download
            const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${exportType}-${year}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setMessage('CSV dosyası başarıyla indirildi.');
        } catch (error) {
            setMessage('CSV oluşturulurken bir hata oluştu.');
            console.error('CSV export error:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportTypes = [
        { value: 'summary', label: 'Özet Rapor', description: 'Tüm şubelerin gelir, gider, kâr/zarar ve marj bilgileri' },
        { value: 'sales', label: 'Satış Verileri', description: 'Aylık satış detayları, kategori bazlı' },
        { value: 'expenses', label: 'Gider Verileri', description: 'Aylık gider detayları, tür bazlı' },
        { value: 'risk', label: 'Risk Analizi', description: 'Şube risk skorları ve faktörleri' },
    ];

    const years = [currentYear, currentYear - 1, currentYear - 2];

    return (
        <div className="animate-fade-in">
            {/* Read-only notice for Viewers */}
            {isViewer() && (
                <div style={{ background: '#fef3c7', color: '#d97706', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                    📋 Salt okunur mod - İzleyici rolü ile rapor indirme yetkisi yoktur.
                </div>
            )}

            {/* Message */}
            {message && (
                <div className={`chart-insight mb-lg`} style={{
                    borderLeftColor: message.includes('hata') ? 'var(--danger-500)' : 'var(--success-500)'
                }}>
                    {message}
                </div>
            )}

            {/* PDF Export */}
            <div className="card mb-lg">
                <div className="card-header">
                    <h3 className="card-title">📄 PDF Yönetici Raporu</h3>
                </div>
                <div className="card-body">
                    <p className="text-muted mb-lg">
                        Kapsamlı yönetici özet raporu oluşturun. Rapor şunları içerir:
                    </p>

                    <div className="charts-grid mb-lg" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                        <div className="chart-insight">
                            <strong>📊 KPI Özeti</strong><br />
                            Toplam gelir, gider, kâr ve marj
                        </div>
                        <div className="chart-insight">
                            <strong>⚠️ Risk Analizi</strong><br />
                            Yüksek riskli şubeler ve uyarılar
                        </div>
                        <div className="chart-insight">
                            <strong>💎 Fırsatlar</strong><br />
                            Yatırım potansiyeli olan ilçeler
                        </div>
                        <div className="chart-insight">
                            <strong>📋 Şube Tablosu</strong><br />
                            Tüm şubelerin performans özeti
                        </div>
                    </div>

                    <div className="flex items-center gap-md">
                        <div className="filter-group">
                            <span className="filter-label">Yıl</span>
                            <select
                                className="form-select"
                                value={year}
                                onChange={(e) => setYear(parseInt(e.target.value))}
                            >
                                {years.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handlePDFExport}
                            disabled={loading}
                        >
                            {loading ? 'Oluşturuluyor...' : '📥 PDF İndir'}
                        </button>
                    </div>
                </div>
            </div>

            {/* CSV Export */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">📊 CSV Veri Dışa Aktarım</h3>
                </div>
                <div className="card-body">
                    <p className="text-muted mb-lg">
                        Ham verileri Excel veya diğer analiz araçlarında kullanmak için CSV formatında dışa aktarın.
                    </p>

                    <div className="comparison-grid mb-lg">
                        {exportTypes.map(type => (
                            <div
                                key={type.value}
                                className={`comparison-card ${exportType === type.value ? 'selected' : ''}`}
                                style={{
                                    cursor: 'pointer',
                                    border: exportType === type.value ? '2px solid var(--primary-500)' : '1px solid var(--gray-200)',
                                    transition: 'all 0.2s ease'
                                }}
                                onClick={() => setExportType(type.value)}
                            >
                                <div className="card-body" style={{ padding: 'var(--spacing-md)' }}>
                                    <div className="flex items-center gap-sm mb-sm">
                                        <input
                                            type="radio"
                                            checked={exportType === type.value}
                                            onChange={() => setExportType(type.value)}
                                            style={{ margin: 0 }}
                                        />
                                        <strong>{type.label}</strong>
                                    </div>
                                    <p className="text-muted" style={{ fontSize: '0.875rem', margin: 0 }}>
                                        {type.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-md">
                        <div className="filter-group">
                            <span className="filter-label">Yıl</span>
                            <select
                                className="form-select"
                                value={year}
                                onChange={(e) => setYear(parseInt(e.target.value))}
                            >
                                {years.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            className="btn btn-success btn-lg"
                            onClick={handleCSVExport}
                            disabled={loading}
                        >
                            {loading ? 'Oluşturuluyor...' : '📥 CSV İndir'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Info */}
            <div className="card mt-lg">
                <div className="card-header">
                    <h3 className="card-title">ℹ️ Rapor Bilgileri</h3>
                </div>
                <div className="card-body">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Rapor Türü</th>
                                    <th>Format</th>
                                    <th>İçerik</th>
                                    <th>Kullanım Alanı</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>Yönetici Raporu</strong></td>
                                    <td><span className="badge badge-danger">PDF</span></td>
                                    <td>Özet, grafikler, öneriler</td>
                                    <td>Yönetim kurulu sunumları, karar alma</td>
                                </tr>
                                <tr>
                                    <td><strong>Özet Rapor</strong></td>
                                    <td><span className="badge badge-success">CSV</span></td>
                                    <td>Şube bazlı P/L özeti</td>
                                    <td>Excel analizi, pivot tablolar</td>
                                </tr>
                                <tr>
                                    <td><strong>Satış Verileri</strong></td>
                                    <td><span className="badge badge-success">CSV</span></td>
                                    <td>Aylık, kategori bazlı satışlar</td>
                                    <td>Trend analizi, tahminleme</td>
                                </tr>
                                <tr>
                                    <td><strong>Gider Verileri</strong></td>
                                    <td><span className="badge badge-success">CSV</span></td>
                                    <td>Aylık, tür bazlı giderler</td>
                                    <td>Maliyet analizi, bütçeleme</td>
                                </tr>
                                <tr>
                                    <td><strong>Risk Analizi</strong></td>
                                    <td><span className="badge badge-success">CSV</span></td>
                                    <td>Risk skorları, faktörler</td>
                                    <td>Şube değerlendirme, kapatma kararları</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
