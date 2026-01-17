import { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { usePermissions } from '../hooks/usePermissions';
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

export default function Scenarios() {
    const { can, isViewer } = usePermissions();
    const [branches, setBranches] = useState([]);
    const [presets, setPresets] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    // Scenario parameters
    const [params, setParams] = useState({
        rent_change_percent: 0,
        salary_change_percent: 0,
        revenue_change_percent: 0,
        staff_change: 0,
        utility_change_percent: 0,
        months_to_simulate: 12
    });

    useEffect(() => {
        fetchBranches();
        fetchPresets();
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

    const fetchPresets = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3001/scenarios/presets', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setPresets(data.presets || []);
        } catch (err) {
            console.error('Presets fetch error:', err);
        }
    };

    const runSimulation = async () => {
        if (!selectedBranch) {
            alert('Lütfen bir şube seçin!');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3001/scenarios/simulate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    branch_id: selectedBranch,
                    ...params
                })
            });

            if (!response.ok) throw new Error('Simülasyon başarısız');

            const data = await response.json();
            setResult(data);
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const applyPreset = (preset) => {
        setParams({
            rent_change_percent: preset.params.rent_change_percent || 0,
            salary_change_percent: preset.params.salary_change_percent || 0,
            revenue_change_percent: preset.params.revenue_change_percent || 0,
            staff_change: preset.params.staff_change || 0,
            utility_change_percent: preset.params.utility_change_percent || 0,
            months_to_simulate: 12
        });
    };

    const resetParams = () => {
        setParams({
            rent_change_percent: 0,
            salary_change_percent: 0,
            revenue_change_percent: 0,
            staff_change: 0,
            utility_change_percent: 0,
            months_to_simulate: 12
        });
        setResult(null);
    };

    // Chart data for projection
    const projectionChartData = result ? {
        labels: result.projection.map(p => `${p.month}. Ay`),
        datasets: [
            {
                label: 'Kümülatif Kâr/Zarar',
                data: result.projection.map(p => p.cumulativeProfit),
                borderColor: result.simulated.profit >= 0 ? '#22c55e' : '#ef4444',
                backgroundColor: result.simulated.profit >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    } : null;

    // Comparison bar chart
    const comparisonChartData = result ? {
        labels: ['Gelir', 'Gider', 'Kâr'],
        datasets: [
            {
                label: 'Mevcut',
                data: [result.current.revenue, result.current.expenses, result.current.profit],
                backgroundColor: '#94a3b8'
            },
            {
                label: 'Simülasyon',
                data: [result.simulated.revenue, result.simulated.expenses, result.simulated.profit],
                backgroundColor: result.simulated.profit >= result.current.profit ? '#22c55e' : '#ef4444'
            }
        ]
    } : null;

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-lg">
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>🔮 What-If Senaryo Simülatörü</h2>
                    <p className="text-muted" style={{ margin: '4px 0 0 0' }}>Farklı senaryoları simüle edin ve sonuçları karşılaştırın</p>
                </div>
            </div>

            {/* Read-only notice for Viewers */}
            {isViewer() && (
                <div style={{ background: '#fef3c7', color: '#d97706', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                    📋 Salt okunur mod - İzleyici rolü ile senaryo simülasyonu yapma yetkisi yoktur.
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px' }}>
                {/* Left Panel - Controls */}
                <div>
                    {/* Branch Selection */}
                    <div className="card mb-lg">
                        <div className="card-header">
                            <h3 className="card-title">📍 Şube Seçimi</h3>
                        </div>
                        <div className="card-body">
                            <select
                                className="form-select"
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                style={{ width: '100%' }}
                            >
                                <option value="">Şube seçin...</option>
                                {branches.map(branch => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.name} ({branch.district})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Preset Scenarios */}
                    <div className="card mb-lg">
                        <div className="card-header">
                            <h3 className="card-title">⚡ Hazır Senaryolar</h3>
                        </div>
                        <div className="card-body" style={{ padding: '12px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                {presets.map(preset => (
                                    <button
                                        key={preset.id}
                                        onClick={() => applyPreset(preset)}
                                        style={{
                                            padding: '12px 8px',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            background: 'white',
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                        onMouseOut={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                                    >
                                        <div style={{ fontSize: '24px', marginBottom: '4px' }}>{preset.icon}</div>
                                        <div style={{ fontSize: '12px', fontWeight: 600 }}>{preset.name}</div>
                                        <div style={{ fontSize: '10px', color: '#6b7280' }}>{preset.description}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Custom Parameters */}
                    <div className="card mb-lg">
                        <div className="card-header">
                            <h3 className="card-title">🎛️ Özel Parametreler</h3>
                        </div>
                        <div className="card-body">
                            <div className="form-group">
                                <label className="form-label">🏠 Kira Değişikliği: {params.rent_change_percent}%</label>
                                <input
                                    type="range"
                                    min="-50"
                                    max="50"
                                    value={params.rent_change_percent}
                                    onChange={(e) => setParams({ ...params, rent_change_percent: parseInt(e.target.value) })}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">💰 Maaş Değişikliği: {params.salary_change_percent}%</label>
                                <input
                                    type="range"
                                    min="-50"
                                    max="50"
                                    value={params.salary_change_percent}
                                    onChange={(e) => setParams({ ...params, salary_change_percent: parseInt(e.target.value) })}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">📈 Gelir Değişikliği: {params.revenue_change_percent}%</label>
                                <input
                                    type="range"
                                    min="-50"
                                    max="50"
                                    value={params.revenue_change_percent}
                                    onChange={(e) => setParams({ ...params, revenue_change_percent: parseInt(e.target.value) })}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">👥 Personel Değişikliği: {params.staff_change > 0 ? '+' : ''}{params.staff_change}</label>
                                <input
                                    type="range"
                                    min="-3"
                                    max="3"
                                    value={params.staff_change}
                                    onChange={(e) => setParams({ ...params, staff_change: parseInt(e.target.value) })}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">💡 Fatura Değişikliği: {params.utility_change_percent}%</label>
                                <input
                                    type="range"
                                    min="-50"
                                    max="50"
                                    value={params.utility_change_percent}
                                    onChange={(e) => setParams({ ...params, utility_change_percent: parseInt(e.target.value) })}
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>
                        <div className="card-footer">
                            <div className="flex gap-sm">
                                <button
                                    className="btn btn-primary"
                                    onClick={runSimulation}
                                    disabled={loading || !can('scenarios.simulate')}
                                    style={{ flex: 1 }}
                                >
                                    {loading ? 'Simüle ediliyor...' : '🚀 Simüle Et'}
                                </button>
                                <button className="btn btn-secondary" onClick={resetParams}>
                                    Sıfırla
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Results */}
                <div>
                    {!result ? (
                        <div className="card" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔮</div>
                                <p>Şube seçin ve parametreleri ayarlayarak</p>
                                <p><strong>"Simüle Et"</strong> butonuna tıklayın</p>
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
                                                background: insight.type === 'positive' ? '#dcfce7' :
                                                    insight.type === 'negative' ? '#fee2e2' :
                                                        insight.type === 'success' ? '#d1fae5' :
                                                            insight.type === 'warning' ? '#fef3c7' : '#dbeafe',
                                                color: insight.type === 'positive' ? '#166534' :
                                                    insight.type === 'negative' ? '#991b1b' :
                                                        insight.type === 'success' ? '#065f46' :
                                                            insight.type === 'warning' ? '#92400e' : '#1e40af'
                                            }}
                                        >
                                            {insight.message}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Comparison Cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                                <div className="card">
                                    <div className="card-body" style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>KÂR DEĞİŞİMİ</div>
                                        <div style={{
                                            fontSize: '24px',
                                            fontWeight: 700,
                                            color: result.comparison.profitChange >= 0 ? '#22c55e' : '#ef4444'
                                        }}>
                                            {result.comparison.profitChange >= 0 ? '+' : ''}{formatCurrency(result.comparison.profitChange)}
                                        </div>
                                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                            ({result.comparison.profitChangePercent}%)
                                        </div>
                                    </div>
                                </div>

                                <div className="card">
                                    <div className="card-body" style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>SİMÜLE EDİLEN KÂR</div>
                                        <div style={{
                                            fontSize: '24px',
                                            fontWeight: 700,
                                            color: result.simulated.profit >= 0 ? '#22c55e' : '#ef4444'
                                        }}>
                                            {formatCurrency(result.simulated.profit)}
                                        </div>
                                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                            Marj: %{result.simulated.margin}
                                        </div>
                                    </div>
                                </div>

                                <div className="card">
                                    <div className="card-body" style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>MEVCUT KÂR</div>
                                        <div style={{
                                            fontSize: '24px',
                                            fontWeight: 700,
                                            color: result.current.profit >= 0 ? '#22c55e' : '#ef4444'
                                        }}>
                                            {formatCurrency(result.current.profit)}
                                        </div>
                                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                            Marj: %{result.current.margin}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Charts */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">📊 Karşılaştırma</h3>
                                    </div>
                                    <div className="card-body">
                                        <Bar
                                            data={comparisonChartData}
                                            options={{
                                                responsive: true,
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

                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">📈 12 Aylık Projeksiyon</h3>
                                    </div>
                                    <div className="card-body">
                                        <Line
                                            data={projectionChartData}
                                            options={{
                                                responsive: true,
                                                plugins: {
                                                    legend: { display: false }
                                                },
                                                scales: {
                                                    y: {
                                                        ticks: {
                                                            callback: (value) => formatCurrency(value)
                                                        }
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Expense Breakdown */}
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">💰 Gider Dağılımı Karşılaştırması</h3>
                                </div>
                                <div className="card-body">
                                    <div className="table-container">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Gider Kalemi</th>
                                                    <th style={{ textAlign: 'right' }}>Mevcut</th>
                                                    <th style={{ textAlign: 'right' }}>Simülasyon</th>
                                                    <th style={{ textAlign: 'right' }}>Fark</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>🏠 Kira</td>
                                                    <td style={{ textAlign: 'right' }}>{formatCurrency(result.current.breakdown.rent)}</td>
                                                    <td style={{ textAlign: 'right' }}>{formatCurrency(result.simulated.breakdown.rent)}</td>
                                                    <td style={{ textAlign: 'right', color: result.simulated.breakdown.rent <= result.current.breakdown.rent ? '#22c55e' : '#ef4444' }}>
                                                        {formatCurrency(result.simulated.breakdown.rent - result.current.breakdown.rent)}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>💰 Maaşlar</td>
                                                    <td style={{ textAlign: 'right' }}>{formatCurrency(result.current.breakdown.salary)}</td>
                                                    <td style={{ textAlign: 'right' }}>{formatCurrency(result.simulated.breakdown.salary)}</td>
                                                    <td style={{ textAlign: 'right', color: result.simulated.breakdown.salary <= result.current.breakdown.salary ? '#22c55e' : '#ef4444' }}>
                                                        {formatCurrency(result.simulated.breakdown.salary - result.current.breakdown.salary)}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>💡 Faturalar</td>
                                                    <td style={{ textAlign: 'right' }}>{formatCurrency(result.current.breakdown.utilities)}</td>
                                                    <td style={{ textAlign: 'right' }}>{formatCurrency(result.simulated.breakdown.utilities)}</td>
                                                    <td style={{ textAlign: 'right', color: result.simulated.breakdown.utilities <= result.current.breakdown.utilities ? '#22c55e' : '#ef4444' }}>
                                                        {formatCurrency(result.simulated.breakdown.utilities - result.current.breakdown.utilities)}
                                                    </td>
                                                </tr>
                                                <tr style={{ fontWeight: 600 }}>
                                                    <td>TOPLAM GİDER</td>
                                                    <td style={{ textAlign: 'right' }}>{formatCurrency(result.current.expenses)}</td>
                                                    <td style={{ textAlign: 'right' }}>{formatCurrency(result.simulated.expenses)}</td>
                                                    <td style={{ textAlign: 'right', color: result.simulated.expenses <= result.current.expenses ? '#22c55e' : '#ef4444' }}>
                                                        {formatCurrency(result.simulated.expenses - result.current.expenses)}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
