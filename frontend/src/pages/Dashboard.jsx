import { useState, useCallback, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { usePolling, formatCurrency, formatPercent, MONTHS_TR } from '../hooks/usePolling';
import { analyticsAPI, branchesAPI } from '../services/api';
import KPICard from '../components/KPICard';
import { useAuth } from '../context/AuthContext';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement);

export default function Dashboard() {
    const { user } = useAuth();
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);

    // Manager sees only their assigned district/branch
    const isManager = user?.role === 'Manager';
    const [district, setDistrict] = useState(user?.district || '');
    const [branch, setBranch] = useState(user?.branch_id ? String(user.branch_id) : '');

    // Update filters when user data loads
    useEffect(() => {
        if (isManager && user?.district) {
            setDistrict(user.district);
        }
        if (isManager && user?.branch_id) {
            setBranch(String(user.branch_id));
        }
    }, [user, isManager]);

    // Fetch KPIs
    const { data: kpisData, loading: kpisLoading, lastUpdated } = usePolling(
        useCallback(() => analyticsAPI.getKPIs({ year, district, branch_id: branch || undefined }), [year, district, branch]),
        { year, district, branch }
    );

    // Fetch monthly trend
    const { data: trendData } = usePolling(
        useCallback(() => analyticsAPI.getMonthlyTrend({ year, district, branch_id: branch || undefined }), [year, district, branch]),
        { year, district, branch }
    );

    // Fetch revenue vs expense
    const { data: revenueData } = usePolling(
        useCallback(() => analyticsAPI.getRevenueExpense({ year, district }), [year, district]),
        { year, district }
    );

    // Fetch branches for filter
    const { data: branchesData } = usePolling(
        useCallback(() => branchesAPI.getAll({ district }), [district]),
        { district }
    );

    // Fetch districts for filter
    const { data: districtsData } = usePolling(
        useCallback(() => branchesAPI.getDistricts(), []),
        {}
    );

    // Fetch expense alerts
    const { data: alertsData } = usePolling(
        useCallback(() => analyticsAPI.getAlerts(), []),
        {},
        60000 // Her dakika güncelle
    );

    // Chart options
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
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

    // Revenue vs Expense Chart Data
    const revenueChartData = {
        labels: revenueData?.data?.map(b => b.name) || [],
        datasets: [
            {
                label: 'Gelir',
                data: revenueData?.data?.map(b => b.revenue) || [],
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderRadius: 4,
            },
            {
                label: 'Gider',
                data: revenueData?.data?.map(b => b.expenses) || [],
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                borderRadius: 4,
            },
        ],
    };

    // Monthly Trend Chart Data
    const trendChartData = {
        labels: trendData?.trend?.map(t => MONTHS_TR[t.monthNum - 1]) || [],
        datasets: [
            {
                label: 'Kâr/Zarar',
                data: trendData?.trend?.map(t => t.profit) || [],
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                fill: true,
                tension: 0.3,
            },
            {
                label: 'Hareketli Ortalama',
                data: trendData?.trend?.map(t => t.movingAverage) || [],
                borderColor: 'rgb(249, 115, 22)',
                borderDash: [5, 5],
                fill: false,
                tension: 0.3,
            },
        ],
    };

    const years = [currentYear, currentYear - 1, currentYear - 2];

    if (kpisLoading && !kpisData) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Manager info banner */}
            {isManager && user?.district && (
                <div style={{ background: '#dbeafe', color: '#1e40af', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📍 <strong>Şube Müdürü Görünümü:</strong> {user.district} ilçesi verilerini görüntülüyorsunuz.
                </div>
            )}

            {/* Filters */}
            <div className="filters-bar">
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

                <div className="filter-group">
                    <span className="filter-label">İlçe</span>
                    <select
                        className="form-select"
                        value={district}
                        onChange={(e) => { setDistrict(e.target.value); setBranch(''); }}
                        disabled={isManager}
                        style={isManager ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                    >
                        <option value="">Tüm İlçeler</option>
                        {districtsData?.districts?.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <span className="filter-label">Şube</span>
                    <select
                        className="form-select"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        disabled={isManager && user?.branch_id}
                        style={(isManager && user?.branch_id) ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                    >
                        <option value="">Tüm Şubeler</option>
                        {branchesData?.branches?.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group" style={{ marginLeft: 'auto' }}>
                    <span className="filter-label">Son Güncelleme</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                        {lastUpdated ? lastUpdated.toLocaleTimeString('tr-TR') : '-'}
                    </span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="kpi-grid">
                <KPICard
                    label="Toplam Gelir"
                    value={formatCurrency(kpisData?.totalRevenue)}
                    icon="💰"
                    type="primary"
                    change={kpisData?.yoyChange}
                />
                <KPICard
                    label="Toplam Gider"
                    value={formatCurrency(kpisData?.totalExpenses)}
                    icon="📉"
                />
                <KPICard
                    label="Net Kâr"
                    value={formatCurrency(kpisData?.netProfit)}
                    icon="📈"
                    type={kpisData?.netProfit >= 0 ? 'success' : 'danger'}
                />
                <KPICard
                    label="Ortalama Marj"
                    value={formatPercent(kpisData?.margin)}
                    icon="📊"
                    type={kpisData?.margin >= 10 ? 'success' : 'warning'}
                />
                <KPICard
                    label="En İyi Şube"
                    value={kpisData?.bestBranch?.name || '-'}
                    subValue={formatCurrency(kpisData?.bestBranch?.profit)}
                    icon="🏆"
                    type="success"
                />
                <KPICard
                    label="En Düşük Şube"
                    value={kpisData?.worstBranch?.name || '-'}
                    subValue={formatCurrency(kpisData?.worstBranch?.profit)}
                    icon="⚠️"
                    type="danger"
                />
            </div>

            {/* Gider Uyarıları Kartı */}
            {alertsData?.totalUnresolved > 0 && (
                <div style={{
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    border: '1px solid #f59e0b',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        background: '#f59e0b',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px'
                    }}>
                        🔔
                    </div>
                    <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, color: '#92400e', fontSize: '16px' }}>
                            Gider Uyarıları ({alertsData.totalUnresolved} adet)
                        </h4>
                        <p style={{ margin: '4px 0 0 0', color: '#a16207', fontSize: '14px' }}>
                            50.000 TL üzeri gider tespit edildi.
                        </p>
                        {alertsData.alerts?.slice(0, 3).map((alert, idx) => (
                            <div key={idx} style={{ fontSize: '13px', color: '#92400e', marginTop: '4px' }}>
                                • {alert.branch_name}: {alert.expense_type} - {formatCurrency(alert.amount)}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Insight */}
            {kpisData?.insight && (
                <div className="chart-insight mb-lg">
                    💡 {kpisData.insight}
                </div>
            )}

            {/* Charts */}
            <div className="charts-grid">
                {/* Revenue vs Expense */}
                <div className="chart-container">
                    <div className="chart-header">
                        <h3 className="chart-title">Gelir vs Gider Karşılaştırması</h3>
                    </div>
                    <div style={{ height: '350px' }}>
                        <Bar data={revenueChartData} options={chartOptions} />
                    </div>
                    <div className="chart-insight">
                        📊 Her şubenin gelir-gider dengesini karşılaştırın. Yeşil çubuklar geliri, kırmızı çubuklar gideri temsil eder.
                    </div>
                </div>

                {/* Monthly Profit Trend */}
                <div className="chart-container">
                    <div className="chart-header">
                        <h3 className="chart-title">Aylık Kâr/Zarar Trendi</h3>
                    </div>
                    <div style={{ height: '350px' }}>
                        <Line data={trendChartData} options={chartOptions} />
                    </div>
                    <div className="chart-insight">
                        📈 Yeşil alan kâr/zarar trendini, turuncu çizgi 3 aylık hareketli ortalamayı gösterir.
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="card mt-lg">
                <div className="card-header">
                    <h3 className="card-title">Özet Bilgiler</h3>
                </div>
                <div className="card-body">
                    <div className="flex gap-lg" style={{ flexWrap: 'wrap' }}>
                        <div>
                            <span className="text-muted">Kârlı Şube Sayısı:</span>{' '}
                            <strong className="text-success">{kpisData?.profitableBranches || 0}</strong>
                        </div>
                        <div>
                            <span className="text-muted">Zarar Eden Şube Sayısı:</span>{' '}
                            <strong className="text-danger">{kpisData?.lossMakingBranches || 0}</strong>
                        </div>
                        <div>
                            <span className="text-muted">Toplam Satış Adedi:</span>{' '}
                            <strong>{kpisData?.totalQuantity?.toLocaleString('tr-TR') || 0}</strong>
                        </div>
                        {kpisData?.yoyChange !== null && (
                            <div>
                                <span className="text-muted">Yıllık Değişim:</span>{' '}
                                <strong className={kpisData?.yoyChange >= 0 ? 'text-success' : 'text-danger'}>
                                    {kpisData?.yoyChange >= 0 ? '+' : ''}{kpisData?.yoyChange}%
                                </strong>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
