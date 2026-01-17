import { useState, useCallback } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { usePolling, formatCurrency, formatPercent, CATEGORY_NAMES, MONTHS_TR } from '../hooks/usePolling';
import { analyticsAPI, branchesAPI } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

export default function BranchComparison() {
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);
    const [selectedBranches, setSelectedBranches] = useState([]);
    const [comparisonData, setComparisonData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch all branches
    const { data: branchesData } = usePolling(
        useCallback(() => branchesAPI.getAll({}), []),
        {},
        true
    );

    const handleBranchToggle = (branchId) => {
        setSelectedBranches(prev => {
            if (prev.includes(branchId)) {
                return prev.filter(id => id !== branchId);
            }
            if (prev.length >= 5) {
                return prev;
            }
            return [...prev, branchId];
        });
    };

    const handleCompare = async () => {
        if (selectedBranches.length < 2) {
            setError('Lütfen en az 2 şube seçin.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await analyticsAPI.getBranchComparison(selectedBranches, year);
            setComparisonData(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Karşılaştırma yapılamadı.');
        } finally {
            setLoading(false);
        }
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value) => formatCurrency(value)
                }
            }
        }
    };

    // Comparison chart data
    const comparisonChartData = comparisonData ? {
        labels: comparisonData.branches.map(b => b.name),
        datasets: [
            {
                label: 'Gelir',
                data: comparisonData.branches.map(b => b.totalRevenue),
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderRadius: 4,
            },
            {
                label: 'Gider',
                data: comparisonData.branches.map(b => b.totalExpenses),
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                borderRadius: 4,
            },
            {
                label: 'Kâr',
                data: comparisonData.branches.map(b => b.profit),
                backgroundColor: 'rgba(34, 197, 94, 0.8)',
                borderRadius: 4,
            },
        ],
    } : null;

    // Category comparison chart
    const categoryChartData = comparisonData ? {
        labels: Object.keys(CATEGORY_NAMES).map(k => CATEGORY_NAMES[k]),
        datasets: comparisonData.branches.map((branch, idx) => ({
            label: branch.name,
            data: Object.keys(CATEGORY_NAMES).map(cat => branch.salesByCategory[cat]?.revenue || 0),
            backgroundColor: `hsla(${idx * 60 + 200}, 70%, 50%, 0.8)`,
            borderRadius: 4,
        })),
    } : null;

    // Monthly trend comparison
    const trendChartData = comparisonData ? {
        labels: comparisonData.branches[0]?.monthlyTrend?.map((t, i) => MONTHS_TR[i] || t.month) || [],
        datasets: comparisonData.branches.map((branch, idx) => ({
            label: branch.name,
            data: branch.monthlyTrend?.map(t => t.revenue) || [],
            borderColor: `hsl(${idx * 60 + 200}, 70%, 50%)`,
            backgroundColor: `hsla(${idx * 60 + 200}, 70%, 50%, 0.1)`,
            tension: 0.3,
        })),
    } : null;

    return (
        <div className="animate-fade-in">
            {/* Branch Selection */}
            <div className="card mb-lg">
                <div className="card-header">
                    <h3 className="card-title">Karşılaştırılacak Şubeleri Seçin (2-5 şube)</h3>
                    <div className="flex gap-md items-center">
                        <select
                            className="form-select"
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            style={{ width: 'auto' }}
                        >
                            {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <button
                            className="btn btn-primary"
                            onClick={handleCompare}
                            disabled={selectedBranches.length < 2 || loading}
                        >
                            {loading ? 'Yükleniyor...' : 'Karşılaştır'}
                        </button>
                    </div>
                </div>
                <div className="card-body">
                    {error && (
                        <div className="login-error mb-md">{error}</div>
                    )}
                    <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                        {branchesData?.branches?.map(branch => (
                            <button
                                key={branch.id}
                                className={`btn ${selectedBranches.includes(branch.id) ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => handleBranchToggle(branch.id)}
                                disabled={!selectedBranches.includes(branch.id) && selectedBranches.length >= 5}
                            >
                                {branch.name}
                            </button>
                        ))}
                    </div>
                    <p className="text-muted mt-md" style={{ fontSize: '0.875rem' }}>
                        Seçili: {selectedBranches.length}/5 şube
                    </p>
                </div>
            </div>

            {/* Comparison Results */}
            {comparisonData && (
                <>
                    {/* Branch Cards */}
                    <div className="comparison-grid mb-lg">
                        {comparisonData.branches.map((branch, idx) => (
                            <div key={branch.id} className="comparison-card">
                                <div className="comparison-header" style={{
                                    background: `linear-gradient(135deg, hsl(${idx * 60 + 200}, 70%, 45%), hsl(${idx * 60 + 200}, 70%, 35%))`
                                }}>
                                    <div className="comparison-branch-name">{branch.name}</div>
                                    <div className="comparison-district">{branch.district}</div>
                                </div>
                                <div className="comparison-metrics">
                                    <div className="comparison-metric">
                                        <span className="metric-label">Toplam Gelir</span>
                                        <span className="metric-value">{formatCurrency(branch.totalRevenue)}</span>
                                    </div>
                                    <div className="comparison-metric">
                                        <span className="metric-label">Toplam Gider</span>
                                        <span className="metric-value">{formatCurrency(branch.totalExpenses)}</span>
                                    </div>
                                    <div className="comparison-metric">
                                        <span className="metric-label">Kâr/Zarar</span>
                                        <span className="metric-value" style={{ color: branch.profit >= 0 ? 'var(--success-500)' : 'var(--danger-500)' }}>
                                            {formatCurrency(branch.profit)}
                                        </span>
                                    </div>
                                    <div className="comparison-metric">
                                        <span className="metric-label">Marj</span>
                                        <span className="metric-value">{formatPercent(branch.margin)}</span>
                                    </div>
                                    <div className="comparison-metric">
                                        <span className="metric-label">Sabit Maliyet Oranı</span>
                                        <span className="metric-value">{formatPercent(branch.fixedCostRatio)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Explanations */}
                    {comparisonData.explanations?.length > 0 && (
                        <div className="card mb-lg">
                            <div className="card-header">
                                <h3 className="card-title">🔍 Performans Farkları Açıklaması</h3>
                            </div>
                            <div className="card-body">
                                {comparisonData.explanations.map((exp, idx) => (
                                    <div key={idx} className="chart-insight mb-sm" style={{
                                        borderLeftColor: exp.impact === 'high' ? 'var(--danger-500)' :
                                            exp.impact === 'medium' ? 'var(--warning-500)' :
                                                'var(--primary-500)'
                                    }}>
                                        <strong>{exp.title}:</strong> {exp.description}
                                    </div>
                                ))}
                                {comparisonData.insight && (
                                    <p className="mt-md" style={{ fontStyle: 'italic', color: 'var(--gray-600)' }}>
                                        💡 {comparisonData.insight}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Charts */}
                    <div className="charts-grid">
                        <div className="chart-container">
                            <div className="chart-header">
                                <h3 className="chart-title">Gelir / Gider / Kâr Karşılaştırması</h3>
                            </div>
                            <div style={{ height: '350px' }}>
                                <Bar data={comparisonChartData} options={chartOptions} />
                            </div>
                        </div>

                        <div className="chart-container">
                            <div className="chart-header">
                                <h3 className="chart-title">Kategori Bazlı Satış Karşılaştırması</h3>
                            </div>
                            <div style={{ height: '350px' }}>
                                <Bar data={categoryChartData} options={chartOptions} />
                            </div>
                        </div>
                    </div>

                    <div className="chart-container mt-lg">
                        <div className="chart-header">
                            <h3 className="chart-title">Aylık Gelir Trendi Karşılaştırması</h3>
                        </div>
                        <div style={{ height: '350px' }}>
                            <Line data={trendChartData} options={chartOptions} />
                        </div>
                    </div>
                </>
            )}

            {!comparisonData && !loading && (
                <div className="card">
                    <div className="card-body" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>⚖️</div>
                        <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Şube Karşılaştırması</h3>
                        <p className="text-muted">
                            Yukarıdan 2-5 şube seçin ve "Karşılaştır" butonuna tıklayın.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
