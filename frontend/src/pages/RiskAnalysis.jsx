import { useCallback } from 'react';
import { usePolling, formatCurrency, formatPercent, getRiskClass } from '../hooks/usePolling';
import { analyticsAPI } from '../services/api';

export default function RiskAnalysis() {
    // Fetch risk data
    const { data: riskData, loading, lastUpdated } = usePolling(
        useCallback(() => analyticsAPI.getRisk(), []),
        {}
    );

    if (loading && !riskData) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Summary */}
            <div className="filters-bar mb-lg">
                <div className="flex items-center gap-lg" style={{ width: '100%' }}>
                    <div>
                        <span className="text-muted">Toplam Şube:</span>{' '}
                        <strong>{riskData?.branches?.length || 0}</strong>
                    </div>
                    <div>
                        <span className="text-muted">Yüksek Riskli:</span>{' '}
                        <strong className="text-danger">{riskData?.closureCandidates?.length || 0}</strong>
                    </div>
                    <div>
                        <span className="text-muted">Orta Riskli:</span>{' '}
                        <strong className="text-warning">
                            {riskData?.branches?.filter(b => b.riskScore >= 40 && b.riskScore < 70).length || 0}
                        </strong>
                    </div>
                    <div>
                        <span className="text-muted">Düşük Riskli:</span>{' '}
                        <strong className="text-success">
                            {riskData?.branches?.filter(b => b.riskScore < 40).length || 0}
                        </strong>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                        <span className="text-muted">Son Güncelleme:</span>{' '}
                        <span>{lastUpdated ? lastUpdated.toLocaleTimeString('tr-TR') : '-'}</span>
                    </div>
                </div>
            </div>

            {/* Insight */}
            {riskData?.insight && (
                <div className="chart-insight mb-lg">
                    💡 {riskData.insight}
                </div>
            )}

            {/* Closure Candidates */}
            {riskData?.closureCandidates?.length > 0 && (
                <div className="card mb-lg" style={{ borderLeft: '4px solid var(--danger-500)' }}>
                    <div className="card-header">
                        <h3 className="card-title" style={{ color: 'var(--danger-600)' }}>
                            ⚠️ Kapatma Riski Yüksek Şubeler
                        </h3>
                    </div>
                    <div className="card-body">
                        <div className="comparison-grid">
                            {riskData.closureCandidates.map(branch => (
                                <RiskCard key={branch.id} branch={branch} isClosureCandidate />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* All Branches Risk List */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Tüm Şubeler Risk Durumu</h3>
                </div>
                <div className="card-body">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Şube</th>
                                    <th>İlçe</th>
                                    <th>Risk Skoru</th>
                                    <th>Risk Seviyesi</th>
                                    <th>Zarar Ayı</th>
                                    <th>Gelir Trendi</th>
                                    <th>Sabit Maliyet</th>
                                    <th>Ortalama Sepet</th>
                                </tr>
                            </thead>
                            <tbody>
                                {riskData?.branches?.map(branch => (
                                    <tr key={branch.id}>
                                        <td><strong>{branch.name}</strong></td>
                                        <td>{branch.district}</td>
                                        <td>
                                            <RiskGauge score={branch.riskScore} size="small" />
                                        </td>
                                        <td>
                                            <span className={`badge badge-${getRiskClass(branch.riskScore)}`}>
                                                {branch.riskLevel}
                                            </span>
                                        </td>
                                        <td>
                                            {branch.factors.lossStreak > 0 ? (
                                                <span className="text-danger">{branch.factors.lossStreak} ay</span>
                                            ) : (
                                                <span className="text-success">Yok</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={branch.factors.revenueTrend >= 0 ? 'text-success' : 'text-danger'}>
                                                {branch.factors.revenueTrend >= 0 ? '+' : ''}{branch.factors.revenueTrend}%
                                            </span>
                                        </td>
                                        <td>{formatPercent(branch.factors.fixedCostRatio)}</td>
                                        <td>{formatCurrency(branch.factors.avgBasket)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Risk Factors Explanation */}
            <div className="card mt-lg">
                <div className="card-header">
                    <h3 className="card-title">📋 Risk Faktörleri Açıklaması</h3>
                </div>
                <div className="card-body">
                    <div className="charts-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                        <div className="chart-insight">
                            <strong>Zarar Ayı Sayısı</strong><br />
                            Ardışık zarar eden ay sayısı. 3+ ay zarar, ciddi risk işareti.
                        </div>
                        <div className="chart-insight">
                            <strong>Gelir Trendi</strong><br />
                            Son 3 ay ile önceki 3 ay karşılaştırması. Negatif trend alarm.
                        </div>
                        <div className="chart-insight">
                            <strong>Sabit Maliyet Oranı</strong><br />
                            Kira + Maaş / Toplam Gider. %70 üzeri riskli.
                        </div>
                        <div className="chart-insight">
                            <strong>Ortalama Sepet</strong><br />
                            Satış başına ortalama gelir. Düşük sepet, düşük verimlilik.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function RiskCard({ branch, isClosureCandidate }) {
    return (
        <div className="comparison-card" style={{
            borderTop: `4px solid ${isClosureCandidate ? 'var(--danger-500)' : `var(--${getRiskClass(branch.riskScore)}-500)`}`
        }}>
            <div className="card-body" style={{ padding: 'var(--spacing-lg)' }}>
                <div className="flex items-center justify-between mb-md">
                    <div>
                        <h4 style={{ margin: 0 }}>{branch.name}</h4>
                        <span className="text-muted">{branch.district}</span>
                    </div>
                    <RiskGauge score={branch.riskScore} />
                </div>

                <div className="comparison-metrics" style={{ padding: 0 }}>
                    <div className="comparison-metric">
                        <span className="metric-label">Risk Seviyesi</span>
                        <span className={`badge badge-${getRiskClass(branch.riskScore)}`}>
                            {branch.riskLevel}
                        </span>
                    </div>
                    <div className="comparison-metric">
                        <span className="metric-label">Zarar Ayı</span>
                        <span className="metric-value text-danger">{branch.factors.lossStreak} ay</span>
                    </div>
                    <div className="comparison-metric">
                        <span className="metric-label">Gelir Trendi</span>
                        <span className={`metric-value ${branch.factors.revenueTrend >= 0 ? 'text-success' : 'text-danger'}`}>
                            {branch.factors.revenueTrend >= 0 ? '+' : ''}{branch.factors.revenueTrend}%
                        </span>
                    </div>
                </div>

                <div className="chart-insight mt-md" style={{ margin: 0, background: 'var(--gray-50)' }}>
                    {branch.explanation}
                </div>
            </div>
        </div>
    );
}

function RiskGauge({ score, size = 'normal' }) {
    const riskClass = getRiskClass(score);
    const dimensions = size === 'small' ? { outer: 50, inner: 38 } : { outer: 80, inner: 60 };

    const getColor = () => {
        if (score >= 70) return 'var(--danger-500)';
        if (score >= 40) return 'var(--warning-500)';
        return 'var(--success-500)';
    };

    return (
        <div
            className={`risk-gauge ${riskClass}`}
            style={{
                width: dimensions.outer,
                height: dimensions.outer,
                background: `conic-gradient(${getColor()} ${score * 3.6}deg, var(--gray-200) 0deg)`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <div
                className="risk-gauge-inner"
                style={{
                    width: dimensions.inner,
                    height: dimensions.inner,
                    background: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <span style={{
                    fontSize: size === 'small' ? '0.875rem' : '1.25rem',
                    fontWeight: 700,
                    color: getColor()
                }}>
                    {score}
                </span>
                {size !== 'small' && (
                    <span style={{ fontSize: '0.625rem', color: 'var(--gray-500)' }}>/100</span>
                )}
            </div>
        </div>
    );
}
