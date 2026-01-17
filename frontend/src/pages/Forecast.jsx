import { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const formatCurrency = (value) => {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value || 0);
};

const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

export default function Forecast() {
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('');
    const [forecastMonths, setForecastMonths] = useState(6);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [comparison, setComparison] = useState(null);
    const [activeTab, setActiveTab] = useState('branch');

    useEffect(() => {
        fetchBranches();
        fetchComparison();
    }, []);

    const fetchBranches = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3001/branches', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setBranches(data.branches || []);
        } catch (err) {
            console.error('Branches fetch error:', err);
        }
    };

    const fetchComparison = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3001/forecast/compare', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setComparison(data.comparisons || []);
        } catch (err) {
            console.error('Comparison fetch error:', err);
        }
    };

    const runForecast = async () => {
        if (!selectedBranch) {
            alert('Lütfen bir şube seçin!');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3001/forecast/branch/${selectedBranch}?months=${forecastMonths}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Tahminleme başarısız');

            const data = await response.json();
            setResult(data);
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatMonth = (monthStr) => {
        const [year, month] = monthStr.split('-');
        return `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`;
    };

    // Combined chart data (historical + forecast)
    const combinedChartData = result ? {
        labels: [
            ...result.historical.map(h => formatMonth(h.month)),
            ...result.forecast.map(f => formatMonth(f.month))
        ],
        datasets: [
            {
                label: 'Gerçek Gelir',
                data: [...result.historical.map(h => h.revenue), ...result.forecast.map(() => null)],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4
            },
            {
                label: 'Tahmin',
                data: [...result.historical.map(() => null), ...result.forecast.map(f => f.revenue)],
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderDash: [5, 5],
                fill: true,
                tension: 0.4,
                pointRadius: 4
            },
            {
                label: 'Güven Aralığı (Alt)',
                data: [...result.historical.map(() => null), ...result.forecast.map(f => f.confidenceLow)],
                borderColor: 'transparent',
                backgroundColor: 'rgba(34, 197, 94, 0.05)',
                fill: '+1',
                tension: 0.4,
                pointRadius: 0
            },
            {
                label: 'Güven Aralığı (Üst)',
                data: [...result.historical.map(() => null), ...result.forecast.map(f => f.confidenceHigh)],
                borderColor: 'rgba(34, 197, 94, 0.3)',
                backgroundColor: 'transparent',
                borderDash: [2, 2],
                tension: 0.4,
                pointRadius: 0
            }
        ]
    } : null;

    // Seasonality chart
    const seasonalityChartData = result ? {
        labels: monthNames,
        datasets: [{
            label: 'Mevsimsellik Faktörü',
            data: Object.values(result.seasonalFactors),
            backgroundColor: Object.values(result.seasonalFactors).map(v =>
                v >= 1 ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)'
            ),
            borderRadius: 4
        }]
    } : null;

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-lg">
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>📈 Satış Tahminleme</h2>
                    <p className="text-muted" style={{ margin: '4px 0 0 0' }}>Geçmiş verilere dayalı gelecek projeksiyonları</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-sm mb-lg">
                <button
                    className={`btn ${activeTab === 'branch' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('branch')}
                >
                    Şube Tahmini
                </button>
                <button
                    className={`btn ${activeTab === 'compare' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('compare')}
                >
                    Tüm Şubeler Karşılaştırma
                </button>
            </div>

            {activeTab === 'branch' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
                    {/* Controls */}
                    <div>
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">🎯 Tahmin Ayarları</h3>
                            </div>
                            <div className="card-body">
                                <div className="form-group">
                                    <label className="form-label">Şube Seçin</label>
                                    <select
                                        className="form-select"
                                        value={selectedBranch}
                                        onChange={(e) => setSelectedBranch(e.target.value)}
                                        style={{ width: '100%' }}
                                    >
                                        <option value="">Şube seçin...</option>
                                        {branches.map(branch => (
                                            <option key={branch.id} value={branch.id}>
                                                {branch.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Tahmin Süresi: {forecastMonths} Ay</label>
                                    <input
                                        type="range"
                                        min="3"
                                        max="12"
                                        value={forecastMonths}
                                        onChange={(e) => setForecastMonths(parseInt(e.target.value))}
                                        style={{ width: '100%' }}
                                    />
                                </div>

                                <button
                                    className="btn btn-primary w-full"
                                    onClick={runForecast}
                                    disabled={loading || !selectedBranch}
                                >
                                    {loading ? 'Hesaplanıyor...' : '📊 Tahmin Oluştur'}
                                </button>
                            </div>
                        </div>

                        {/* Summary Card */}
                        {result && (
                            <div className="card mt-lg">
                                <div className="card-header">
                                    <h3 className="card-title">📋 Özet</h3>
                                </div>
                                <div className="card-body">
                                    <div style={{ marginBottom: '12px' }}>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Trend Yönü</div>
                                        <div style={{
                                            fontSize: '18px',
                                            fontWeight: 600,
                                            color: result.summary.trendDirection === 'up' ? '#22c55e' :
                                                result.summary.trendDirection === 'down' ? '#ef4444' : '#6b7280'
                                        }}>
                                            {result.summary.trendDirection === 'up' ? '📈 Yükseliş' :
                                                result.summary.trendDirection === 'down' ? '📉 Düşüş' : '➡️ Sabit'}
                                            ({result.summary.trendPercent > 0 ? '+' : ''}{result.summary.trendPercent}%)
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '12px' }}>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Tahmini Toplam Gelir</div>
                                        <div style={{ fontSize: '18px', fontWeight: 600 }}>
                                            {formatCurrency(result.summary.totalForecastRevenue)}
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '12px' }}>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Tahmini Toplam Kâr</div>
                                        <div style={{
                                            fontSize: '18px',
                                            fontWeight: 600,
                                            color: result.summary.totalForecastProfit >= 0 ? '#22c55e' : '#ef4444'
                                        }}>
                                            {formatCurrency(result.summary.totalForecastProfit)}
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Kârlı Ay Sayısı</div>
                                        <div style={{ fontSize: '18px', fontWeight: 600 }}>
                                            {result.summary.profitableMonths} / {result.summary.forecastMonths}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Results */}
                    <div>
                        {!result ? (
                            <div className="card" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📈</div>
                                    <p>Şube seçin ve tahmin süresi belirleyerek</p>
                                    <p><strong>"Tahmin Oluştur"</strong> butonuna tıklayın</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Insights */}
                                {result.insights.length > 0 && (
                                    <div className="mb-lg">
                                        {result.insights.map((insight, idx) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    padding: '12px 16px',
                                                    borderRadius: '8px',
                                                    marginBottom: '8px',
                                                    background: insight.type === 'positive' || insight.type === 'success' ? '#dcfce7' :
                                                        insight.type === 'warning' ? '#fef3c7' :
                                                            insight.type === 'danger' ? '#fee2e2' : '#dbeafe',
                                                    color: insight.type === 'positive' || insight.type === 'success' ? '#166534' :
                                                        insight.type === 'warning' ? '#92400e' :
                                                            insight.type === 'danger' ? '#991b1b' : '#1e40af'
                                                }}
                                            >
                                                {insight.message}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Main Chart */}
                                <div className="card mb-lg">
                                    <div className="card-header">
                                        <h3 className="card-title">📊 Gelir Tahmin Grafiği - {result.branch.name}</h3>
                                    </div>
                                    <div className="card-body" style={{ height: '350px' }}>
                                        <Line
                                            data={combinedChartData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: { position: 'bottom' }
                                                },
                                                scales: {
                                                    y: {
                                                        beginAtZero: true,
                                                        ticks: {
                                                            callback: (value) => formatCurrency(value)
                                                        }
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Seasonality Chart */}
                                <div className="card mb-lg">
                                    <div className="card-header">
                                        <h3 className="card-title">🌡️ Mevsimsellik Analizi</h3>
                                    </div>
                                    <div className="card-body" style={{ height: '250px' }}>
                                        <Bar
                                            data={seasonalityChartData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: { display: false }
                                                },
                                                scales: {
                                                    y: {
                                                        min: 0.5,
                                                        max: 1.5,
                                                        ticks: {
                                                            callback: (value) => `${(value * 100).toFixed(0)}%`
                                                        }
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="card-footer">
                                        <p className="text-muted" style={{ fontSize: '12px', margin: 0 }}>
                                            %100 üzeri aylar ortalamanın üstünde satış yapılan dönemlerdir.
                                        </p>
                                    </div>
                                </div>

                                {/* Forecast Table */}
                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">📅 Aylık Tahmin Detayları</h3>
                                    </div>
                                    <div className="card-body">
                                        <div className="table-container">
                                            <table className="table">
                                                <thead>
                                                    <tr>
                                                        <th>Ay</th>
                                                        <th style={{ textAlign: 'right' }}>Tahm. Gelir</th>
                                                        <th style={{ textAlign: 'right' }}>Tahm. Gider</th>
                                                        <th style={{ textAlign: 'right' }}>Tahm. Kâr</th>
                                                        <th style={{ textAlign: 'center' }}>Durum</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {result.forecast.map((f, idx) => (
                                                        <tr key={idx}>
                                                            <td><strong>{formatMonth(f.month)}</strong></td>
                                                            <td style={{ textAlign: 'right' }}>{formatCurrency(f.revenue)}</td>
                                                            <td style={{ textAlign: 'right' }}>{formatCurrency(f.expenses)}</td>
                                                            <td style={{
                                                                textAlign: 'right',
                                                                color: f.profit >= 0 ? '#22c55e' : '#ef4444',
                                                                fontWeight: 600
                                                            }}>
                                                                {formatCurrency(f.profit)}
                                                            </td>
                                                            <td style={{ textAlign: 'center' }}>
                                                                {f.isOptimistic ? '✅' : '⚠️'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            ) : (
                /* Comparison Tab */
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">📊 Tüm Şubeler - Gelecek Yıl Projeksiyonu</h3>
                    </div>
                    <div className="card-body">
                        {comparison ? (
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Şube</th>
                                            <th>İlçe</th>
                                            <th style={{ textAlign: 'right' }}>Mevcut Gelir</th>
                                            <th style={{ textAlign: 'right' }}>Büyüme</th>
                                            <th style={{ textAlign: 'right' }}>Proj. Gelir</th>
                                            <th style={{ textAlign: 'right' }}>Proj. Kâr</th>
                                            <th style={{ textAlign: 'center' }}>Görünüm</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {comparison.map((c) => (
                                            <tr key={c.id}>
                                                <td><strong>{c.name}</strong></td>
                                                <td>{c.district}</td>
                                                <td style={{ textAlign: 'right' }}>{formatCurrency(c.currentRevenue)}</td>
                                                <td style={{
                                                    textAlign: 'right',
                                                    color: parseFloat(c.growthRate) >= 0 ? '#22c55e' : '#ef4444'
                                                }}>
                                                    {parseFloat(c.growthRate) >= 0 ? '+' : ''}{c.growthRate}%
                                                </td>
                                                <td style={{ textAlign: 'right' }}>{formatCurrency(c.projectedRevenue)}</td>
                                                <td style={{
                                                    textAlign: 'right',
                                                    color: c.projectedProfit >= 0 ? '#22c55e' : '#ef4444',
                                                    fontWeight: 600
                                                }}>
                                                    {formatCurrency(c.projectedProfit)}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span className={`badge badge-${c.outlook === 'positive' ? 'success' : 'danger'}`}>
                                                        {c.outlook === 'positive' ? '📈 Olumlu' : '📉 Olumsuz'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
