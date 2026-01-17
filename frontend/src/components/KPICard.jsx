export default function KPICard({ label, value, subValue, icon, type = 'default', change }) {
    const getTypeClass = () => {
        switch (type) {
            case 'primary': return 'kpi-card primary';
            case 'success': return 'kpi-card success';
            case 'warning': return 'kpi-card warning';
            case 'danger': return 'kpi-card danger';
            default: return 'kpi-card';
        }
    };

    return (
        <div className={getTypeClass()}>
            <div className="kpi-header">
                <span className="kpi-label">{label}</span>
                <div className="kpi-icon">{icon}</div>
            </div>
            <div className="kpi-value">{value}</div>
            {subValue && (
                <div style={{ fontSize: '0.875rem', color: type === 'primary' ? 'rgba(255,255,255,0.8)' : 'var(--gray-500)', marginTop: '4px' }}>
                    {subValue}
                </div>
            )}
            {change !== null && change !== undefined && (
                <span className={`kpi-change ${change >= 0 ? 'positive' : 'negative'}`}>
                    {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% geçen yıla göre
                </span>
            )}
        </div>
    );
}
