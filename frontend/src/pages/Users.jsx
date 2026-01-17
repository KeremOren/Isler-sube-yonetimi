import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Users() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'Viewer'
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3001/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                if (response.status === 403) {
                    setError('Bu sayfaya erişim yetkiniz yok. Sadece Admin kullanıcılar erişebilir.');
                } else {
                    throw new Error('Veriler alınamadı');
                }
                return;
            }

            const data = await response.json();
            setUsers(data.users || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem('token');
            const url = editingUser
                ? `http://localhost:3001/users/${editingUser.id}`
                : 'http://localhost:3001/users';

            const response = await fetch(url, {
                method: editingUser ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'İşlem başarısız');
            }

            setShowForm(false);
            setEditingUser(null);
            setFormData({ name: '', email: '', password: '', role: 'Viewer' });
            fetchUsers();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role
        });
        setShowForm(true);
    };

    const handleDelete = async (userId) => {
        if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3001/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Silme başarısız');
            }

            fetchUsers();
        } catch (err) {
            alert(err.message);
        }
    };

    const getRoleBadge = (role) => {
        const styles = {
            Admin: { bg: '#fee2e2', color: '#dc2626' },
            Manager: { bg: '#dbeafe', color: '#2563eb' },
            Viewer: { bg: '#f3f4f6', color: '#6b7280' }
        };
        const s = styles[role] || styles.Viewer;
        return (
            <span style={{
                background: s.bg,
                color: s.color,
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 500
            }}>
                {role}
            </span>
        );
    };

    if (error && error.includes('yetkiniz yok')) {
        return (
            <div className="animate-fade-in">
                <div className="card">
                    <div className="card-body" style={{ textAlign: 'center', padding: '60px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
                        <h3 style={{ marginBottom: '8px' }}>Erişim Engellendi</h3>
                        <p className="text-muted">Bu sayfaya sadece Admin kullanıcılar erişebilir.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-lg">
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>👥 Kullanıcı Yönetimi</h2>
                    <p className="text-muted" style={{ margin: '4px 0 0 0' }}>Sistem kullanıcılarını yönetin</p>
                </div>
                <button className="btn btn-primary" onClick={() => {
                    setEditingUser(null);
                    setFormData({ name: '', email: '', password: '', role: 'Viewer' });
                    setShowForm(true);
                }}>
                    + Yeni Kullanıcı
                </button>
            </div>

            {/* Stats Cards */}
            <div className="kpi-grid mb-lg">
                <div className="kpi-card">
                    <div className="kpi-icon">👥</div>
                    <div className="kpi-value">{users.length}</div>
                    <div className="kpi-label">Toplam Kullanıcı</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon">🔴</div>
                    <div className="kpi-value">{users.filter(u => u.role === 'Admin').length}</div>
                    <div className="kpi-label">Admin</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon">🔵</div>
                    <div className="kpi-value">{users.filter(u => u.role === 'Manager').length}</div>
                    <div className="kpi-label">Manager</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon">⚪</div>
                    <div className="kpi-value">{users.filter(u => u.role === 'Viewer').length}</div>
                    <div className="kpi-label">Viewer</div>
                </div>
            </div>

            {/* Users Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Kullanıcı Listesi</h3>
                </div>
                <div className="card-body">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>İsim</th>
                                        <th>E-posta</th>
                                        <th>Rol</th>
                                        <th>Kayıt Tarihi</th>
                                        <th style={{ textAlign: 'center' }}>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id}>
                                            <td>{user.id}</td>
                                            <td>
                                                <strong>{user.name}</strong>
                                                {user.id === currentUser?.id && (
                                                    <span style={{
                                                        marginLeft: '8px',
                                                        fontSize: '10px',
                                                        background: '#dbeafe',
                                                        color: '#2563eb',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px'
                                                    }}>
                                                        Sen
                                                    </span>
                                                )}
                                            </td>
                                            <td>{user.email}</td>
                                            <td>{getRoleBadge(user.role)}</td>
                                            <td>{new Date(user.created_at).toLocaleDateString('tr-TR')}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button
                                                    className="btn btn-secondary"
                                                    style={{ marginRight: '8px', padding: '4px 12px', fontSize: '12px' }}
                                                    onClick={() => handleEdit(user)}
                                                >
                                                    ✏️ Düzenle
                                                </button>
                                                {user.id !== currentUser?.id && (
                                                    <button
                                                        className="btn btn-danger"
                                                        style={{ padding: '4px 12px', fontSize: '12px' }}
                                                        onClick={() => handleDelete(user.id)}
                                                    >
                                                        🗑️ Sil
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* User Form Modal */}
            {showForm && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="card" style={{ width: '450px' }}>
                        <div className="card-header">
                            <h3 className="card-title">
                                {editingUser ? '✏️ Kullanıcı Düzenle' : '➕ Yeni Kullanıcı'}
                            </h3>
                            <button
                                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingUser(null);
                                }}
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="card-body">
                                <div className="form-group">
                                    <label className="form-label">İsim *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">E-posta *</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        Şifre {editingUser && '(boş bırakılırsa değişmez)'}
                                    </label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required={!editingUser}
                                        minLength={6}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Rol</label>
                                    <select
                                        className="form-select"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="Viewer">Viewer - Sadece görüntüleme</option>
                                        <option value="Manager">Manager - Yönetim yetkileri</option>
                                        <option value="Admin">Admin - Tam yetki</option>
                                    </select>
                                </div>
                            </div>
                            <div className="card-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingUser(null);
                                    }}
                                >
                                    İptal
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ marginLeft: '8px' }}>
                                    {editingUser ? 'Güncelle' : 'Oluştur'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
