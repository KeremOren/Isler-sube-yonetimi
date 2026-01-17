import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePermissions } from '../hooks/usePermissions';

const navItems = [
    { path: '/dashboard', label: 'Gösterge Paneli', icon: '📊', permission: 'analytics.view' },
    { path: '/comparison', label: 'Şube Karşılaştırma', icon: '⚖️', permission: 'analytics.view' },
    { path: '/risk', label: 'Risk Analizi', icon: '⚠️', permission: 'analytics.view' },
    { path: '/scenarios', label: 'Senaryo Simülatörü', icon: '🔮', permission: 'scenarios.view' },
    { path: '/forecast', label: 'Tahminleme', icon: '📈', permission: 'forecast.view' },
    { path: '/map', label: 'Harita Görünümü', icon: '🗺️', permission: 'map.view' },
    { path: '/decisions', label: 'Grup Kararları', icon: '🤝', permission: 'decisions.view' },
    { path: '/reports', label: 'Raporlar', icon: '📄', permission: 'reports.view' },
    { path: '/users', label: 'Kullanıcı Yönetimi', icon: '👥', permission: 'users.view' },
];

export default function Layout() {
    const { user, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const { can, getRoleLabel, getRoleColor } = usePermissions();
    const location = useLocation();

    const roleStyle = getRoleColor();

    // Filter nav items based on permissions
    const visibleNavItems = navItems.filter(item => can(item.permission));

    const getPageTitle = () => {
        const item = navItems.find(nav => nav.path === location.pathname);
        return item?.label || 'İşler Kitabevi';
    };

    const getPageSubtitle = () => {
        switch (location.pathname) {
            case '/dashboard':
                return 'Şube performans metrikleri ve KPI\'lar';
            case '/comparison':
                return 'Şubeler arası performans karşılaştırması';
            case '/risk':
                return 'Risk skorları ve kapatma adayları';
            case '/scenarios':
                return 'What-if senaryo simülasyonları';
            case '/forecast':
                return 'Satış tahminleri ve trend analizi';
            case '/map':
                return 'Coğrafi analiz ve fırsat haritası';
            case '/decisions':
                return 'Grup kararları, oylama ve tartışma';
            case '/reports':
                return 'PDF ve CSV raporları';
            case '/users':
                return 'Kullanıcı ekleme, düzenleme ve silme';
            default:
                return '';
        }
    };

    return (
        <div className="app-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <a href="/dashboard" className="sidebar-logo">
                        <div className="sidebar-logo-icon">📚</div>
                        <span>İşler Kitabevi</span>
                    </a>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section-title">Ana Menü</div>
                    {visibleNavItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            <span className="nav-link-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="user-details">
                            <div className="user-name">{user?.name || 'Kullanıcı'}</div>
                            <div
                                className="user-role-badge"
                                style={{
                                    background: roleStyle.bg,
                                    color: roleStyle.color,
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    display: 'inline-block'
                                }}
                            >
                                {getRoleLabel()}
                            </div>
                        </div>
                    </div>
                    <button className="btn btn-secondary w-full mt-md" onClick={logout}>
                        Çıkış Yap
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="page-header">
                    <div>
                        <h1 className="page-title">{getPageTitle()}</h1>
                        <p className="page-subtitle">{getPageSubtitle()}</p>
                    </div>
                    <div className="flex items-center gap-md">
                        {/* Theme Toggle */}
                        <button
                            className="theme-toggle"
                            onClick={toggleTheme}
                            title={isDark ? 'Açık Tema' : 'Koyu Tema'}
                        >
                            {isDark ? '☀️' : '🌙'}
                        </button>
                        <span className="text-muted" style={{ fontSize: '0.875rem' }}>
                            {new Date().toLocaleDateString('tr-TR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </span>
                    </div>
                </header>

                <div className="page-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

