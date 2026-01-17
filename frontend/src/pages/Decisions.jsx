import { useState, useEffect } from 'react';
import { usePermissions } from '../hooks/usePermissions';

export default function Decisions() {
    const { can, isViewer } = usePermissions();
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [selectedNote, setSelectedNote] = useState(null);
    const [filter, setFilter] = useState('all');

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        note_type: 'insight',
        priority: 'medium',
        branch_id: ''
    });

    // Comment state
    const [newComment, setNewComment] = useState('');

    const fetchNotes = async () => {
        try {
            const token = localStorage.getItem('token');
            let url = 'http://localhost:3001/decisions';
            if (filter !== 'all') {
                url += `?status=${filter}`;
            }

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Veriler alınamadı');

            const data = await response.json();
            setNotes(data.notes || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, [filter]);

    const fetchNoteDetail = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3001/decisions/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Detay alınamadı');

            const data = await response.json();
            setSelectedNote(data);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3001/decisions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Karar notu oluşturulamadı');

            setShowForm(false);
            setFormData({ title: '', content: '', note_type: 'insight', priority: 'medium', branch_id: '' });
            fetchNotes();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleVote = async (noteId, vote) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3001/decisions/${noteId}/vote`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ vote })
            });

            if (!response.ok) throw new Error('Oy verilemedi');

            fetchNotes();
            if (selectedNote) fetchNoteDetail(noteId);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleComment = async (noteId) => {
        if (!newComment.trim()) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3001/decisions/${noteId}/comments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ comment: newComment })
            });

            if (!response.ok) throw new Error('Yorum eklenemedi');

            setNewComment('');
            fetchNoteDetail(noteId);
            fetchNotes(); // Ana listeyi de güncelle
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteComment = async (noteId, commentId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3001/decisions/${noteId}/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Yorum silinemedi');
            }

            fetchNoteDetail(noteId);
            fetchNotes();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteNote = async (noteId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3001/decisions/${noteId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Karar notu silinemedi');
            }

            setSelectedNote(null);
            fetchNotes();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleStatusChange = async (noteId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3001/decisions/${noteId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Durum güncellenemedi');
            }

            fetchNoteDetail(noteId);
            fetchNotes();
        } catch (err) {
            alert(err.message);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'insight': return '💡';
            case 'recommendation': return '📋';
            case 'warning': return '⚠️';
            case 'decision': return '✅';
            default: return '📝';
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            open: { bg: '#dbeafe', color: '#1d4ed8', text: 'Açık' },
            in_review: { bg: '#fef3c7', color: '#d97706', text: 'İncelemede' },
            approved: { bg: '#dcfce7', color: '#16a34a', text: 'Onaylandı' },
            rejected: { bg: '#fee2e2', color: '#dc2626', text: 'Reddedildi' },
            implemented: { bg: '#e0e7ff', color: '#4338ca', text: 'Uygulandı' }
        };
        const s = styles[status] || styles.open;
        return (
            <span style={{ background: s.bg, color: s.color, padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 500 }}>
                {s.text}
            </span>
        );
    };

    const getPriorityBadge = (priority) => {
        const styles = {
            low: { bg: '#f3f4f6', color: '#6b7280', text: 'Düşük' },
            medium: { bg: '#dbeafe', color: '#2563eb', text: 'Orta' },
            high: { bg: '#fef3c7', color: '#d97706', text: 'Yüksek' },
            critical: { bg: '#fee2e2', color: '#dc2626', text: 'Kritik' }
        };
        const s = styles[priority] || styles.medium;
        return (
            <span style={{ background: s.bg, color: s.color, padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 500 }}>
                {s.text}
            </span>
        );
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-lg">
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>🤝 Grup Kararları</h2>
                    <p className="text-muted" style={{ margin: '4px 0 0 0' }}>Kararları paylaşın, tartışın ve oylayın</p>
                </div>
                {can('decisions.create') && (
                    <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                        + Yeni Karar Notu
                    </button>
                )}
            </div>

            {/* Read-only notice for Viewers */}
            {isViewer() && (
                <div style={{ background: '#fef3c7', color: '#d97706', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                    📋 Salt okunur mod - İzleyici rolü ile karar oluşturamaz, oylayamaz veya yorum yapamazsınız.
                </div>
            )}

            {/* Filters */}
            <div className="filters-bar mb-lg">
                <div className="filter-group">
                    <span className="filter-label">Durum Filtresi</span>
                    <select className="form-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
                        <option value="all">Tümü</option>
                        <option value="open">Açık</option>
                        <option value="in_review">İncelemede</option>
                        <option value="approved">Onaylandı</option>
                        <option value="rejected">Reddedildi</option>
                        <option value="implemented">Uygulandı</option>
                    </select>
                </div>
            </div>

            {error && (
                <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                    ⚠️ {error}
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: selectedNote ? '1fr 400px' : '1fr', gap: '24px' }}>
                    {/* Notes List */}
                    <div>
                        {notes.length === 0 ? (
                            <div className="card">
                                <div className="card-body" style={{ textAlign: 'center', padding: '40px' }}>
                                    <p className="text-muted">Henüz karar notu bulunmuyor.</p>
                                </div>
                            </div>
                        ) : (
                            notes.map(note => (
                                <div
                                    key={note.id}
                                    className="card mb-md"
                                    style={{ cursor: 'pointer', borderLeft: selectedNote?.note?.id === note.id ? '4px solid #3b82f6' : 'none' }}
                                    onClick={() => fetchNoteDetail(note.id)}
                                >
                                    <div className="card-body">
                                        <div className="flex items-center justify-between mb-sm">
                                            <div className="flex items-center gap-sm">
                                                <span style={{ fontSize: '20px' }}>{getTypeIcon(note.note_type)}</span>
                                                <h4 style={{ margin: 0, fontSize: '1rem' }}>{note.title}</h4>
                                            </div>
                                            <div className="flex items-center gap-sm">
                                                {getPriorityBadge(note.priority)}
                                                {getStatusBadge(note.status)}
                                            </div>
                                        </div>

                                        <p style={{ color: '#6b7280', fontSize: '14px', margin: '8px 0' }}>
                                            {note.content.substring(0, 150)}...
                                        </p>

                                        <div className="flex items-center justify-between" style={{ fontSize: '12px', color: '#9ca3af' }}>
                                            <div className="flex items-center gap-md">
                                                {note.branch_name && <span>📍 {note.branch_name}</span>}
                                                <span>👤 {note.author_name}</span>
                                                <span>💬 {note.comment_count} yorum</span>
                                            </div>
                                            <div className="flex items-center gap-sm">
                                                <span style={{ color: '#22c55e' }}>👍 {note.approve_count}</span>
                                                <span style={{ color: '#ef4444' }}>👎 {note.reject_count}</span>
                                                <span style={{ color: '#6b7280' }}>🤷 {note.neutral_count}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Note Detail Panel */}
                    {selectedNote && (
                        <div className="card" style={{ position: 'sticky', top: '100px', height: 'fit-content' }}>
                            <div className="card-header">
                                <h3 className="card-title">Karar Detayı</h3>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#ef4444' }}
                                        onClick={() => handleDeleteNote(selectedNote.note.id)}
                                        title="Notu sil"
                                    >
                                        🗑️
                                    </button>
                                    <button
                                        style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
                                        onClick={() => setSelectedNote(null)}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                            <div className="card-body">
                                <div className="flex items-center gap-sm mb-sm">
                                    <span style={{ fontSize: '24px' }}>{getTypeIcon(selectedNote.note.note_type)}</span>
                                    <h4 style={{ margin: 0 }}>{selectedNote.note.title}</h4>
                                </div>

                                <div className="flex items-center gap-sm mb-md">
                                    {getPriorityBadge(selectedNote.note.priority)}
                                    {getStatusBadge(selectedNote.note.status)}
                                </div>

                                {/* Status Change */}
                                {can('decisions.edit') && (
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                                            📋 Durumu Değiştir:
                                        </label>
                                        <select
                                            className="form-select"
                                            value={selectedNote.note.status}
                                            onChange={(e) => handleStatusChange(selectedNote.note.id, e.target.value)}
                                            style={{ width: '100%' }}
                                        >
                                            <option value="open">Açık</option>
                                            <option value="in_review">İncelemede</option>
                                            <option value="approved">Onaylandı</option>
                                            <option value="rejected">Reddedildi</option>
                                            <option value="implemented">Uygulandı</option>
                                        </select>
                                    </div>
                                )}

                                <p style={{ fontSize: '14px', lineHeight: 1.6 }}>{selectedNote.note.content}</p>

                                {/* Voting */}
                                {can('decisions.vote') ? (
                                    <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', margin: '16px 0' }}>
                                        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '12px' }}>🗳️ Oyunuz:</div>
                                        <div className="flex items-center gap-sm">
                                            <button
                                                className={`btn ${selectedNote.userVote === 'approve' ? 'btn-success' : 'btn-outline'}`}
                                                onClick={() => handleVote(selectedNote.note.id, 'approve')}
                                            >
                                                👍 Onay ({selectedNote.voteSummary.approve})
                                            </button>
                                            <button
                                                className={`btn ${selectedNote.userVote === 'reject' ? 'btn-danger' : 'btn-outline'}`}
                                                onClick={() => handleVote(selectedNote.note.id, 'reject')}
                                            >
                                                👎 Red ({selectedNote.voteSummary.reject})
                                            </button>
                                            <button
                                                className={`btn ${selectedNote.userVote === 'neutral' ? 'btn-secondary' : 'btn-outline'}`}
                                                onClick={() => handleVote(selectedNote.note.id, 'neutral')}
                                            >
                                                🤷 Tarafsız ({selectedNote.voteSummary.neutral})
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '8px', margin: '16px 0', textAlign: 'center', color: '#6b7280' }}>
                                        🔒 Oy verme yetkisi gerekli
                                    </div>
                                )}

                                {/* Comments */}
                                <div style={{ marginTop: '16px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '12px' }}>💬 Yorumlar ({selectedNote.comments.length})</div>

                                    {selectedNote.comments.map(comment => (
                                        <div key={comment.id} style={{ background: '#f3f4f6', padding: '12px', borderRadius: '8px', marginBottom: '8px', position: 'relative' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                    <strong>{comment.author_name}</strong> • {new Date(comment.created_at).toLocaleDateString('tr-TR')}
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteComment(selectedNote.note.id, comment.id)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        color: '#ef4444',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px'
                                                    }}
                                                    title="Yorumu sil"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '14px' }}>{comment.comment}</p>
                                        </div>
                                    ))}

                                    {/* Add Comment */}
                                    {can('decisions.comment') && (
                                        <div className="flex gap-sm" style={{ marginTop: '12px' }}>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Yorum yazın..."
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleComment(selectedNote.note.id)}
                                            />
                                            <button className="btn btn-primary" onClick={() => handleComment(selectedNote.note.id)}>
                                                Gönder
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* New Note Form Modal */}
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
                    <div className="card" style={{ width: '500px', maxHeight: '90vh', overflow: 'auto' }}>
                        <div className="card-header">
                            <h3 className="card-title">Yeni Karar Notu</h3>
                            <button
                                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
                                onClick={() => setShowForm(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="card-body">
                                <div className="form-group">
                                    <label className="form-label">Başlık *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">İçerik *</label>
                                    <textarea
                                        className="form-input"
                                        rows={4}
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        required
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Tür</label>
                                        <select
                                            className="form-select"
                                            value={formData.note_type}
                                            onChange={(e) => setFormData({ ...formData, note_type: e.target.value })}
                                        >
                                            <option value="insight">💡 Görüş</option>
                                            <option value="recommendation">📋 Öneri</option>
                                            <option value="warning">⚠️ Uyarı</option>
                                            <option value="decision">✅ Karar</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Öncelik</label>
                                        <select
                                            className="form-select"
                                            value={formData.priority}
                                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                        >
                                            <option value="low">Düşük</option>
                                            <option value="medium">Orta</option>
                                            <option value="high">Yüksek</option>
                                            <option value="critical">Kritik</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="card-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>İptal</button>
                                <button type="submit" className="btn btn-primary" style={{ marginLeft: '8px' }}>Oluştur</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
