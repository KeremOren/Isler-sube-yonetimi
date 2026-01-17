const express = require('express');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();


router.get('/', authenticate, async (req, res) => {
    try {
        const { branch_id, status, type } = req.query;

        let query = `
            SELECT 
                dn.*,
                b.name as branch_name,
                u.name as author_name,
                (SELECT COUNT(*) FROM decision_comments dc WHERE dc.note_id = dn.id) as comment_count,
                (SELECT COUNT(*) FROM decision_votes dv WHERE dv.note_id = dn.id AND dv.vote = 'approve') as approve_count,
                (SELECT COUNT(*) FROM decision_votes dv WHERE dv.note_id = dn.id AND dv.vote = 'reject') as reject_count,
                (SELECT COUNT(*) FROM decision_votes dv WHERE dv.note_id = dn.id AND dv.vote = 'neutral') as neutral_count
            FROM decision_notes dn
            LEFT JOIN branches b ON dn.branch_id = b.id
            LEFT JOIN users u ON dn.user_id = u.id
            WHERE 1=1
        `;

        const params = [];

        if (branch_id) {
            query += ' AND dn.branch_id = ?';
            params.push(branch_id);
        }

        if (status) {
            query += ' AND dn.status = ?';
            params.push(status);
        }

        if (type) {
            query += ' AND dn.note_type = ?';
            params.push(type);
        }

        query += ' ORDER BY dn.created_at DESC';

        const [notes] = await db.execute(query, params);

        res.json({ notes });
    } catch (error) {
        console.error('Get decisions error:', error);
        res.status(500).json({ error: 'Kararlar alınamadı.' });
    }
});


router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        
        const [notes] = await db.execute(`
            SELECT 
                dn.*,
                b.name as branch_name,
                u.name as author_name
            FROM decision_notes dn
            LEFT JOIN branches b ON dn.branch_id = b.id
            LEFT JOIN users u ON dn.user_id = u.id
            WHERE dn.id = ?
        `, [id]);

        if (notes.length === 0) {
            return res.status(404).json({ error: 'Karar notu bulunamadı.' });
        }

        
        const [comments] = await db.execute(`
            SELECT dc.*, u.name as author_name
            FROM decision_comments dc
            LEFT JOIN users u ON dc.user_id = u.id
            WHERE dc.note_id = ?
            ORDER BY dc.created_at ASC
        `, [id]);

        
        const [votes] = await db.execute(`
            SELECT dv.*, u.name as voter_name
            FROM decision_votes dv
            LEFT JOIN users u ON dv.user_id = u.id
            WHERE dv.note_id = ?
        `, [id]);

        
        const voteSummary = {
            approve: votes.filter(v => v.vote === 'approve').length,
            reject: votes.filter(v => v.vote === 'reject').length,
            neutral: votes.filter(v => v.vote === 'neutral').length,
            total: votes.length
        };

        
        const userVote = votes.find(v => v.user_id === req.user.id);

        res.json({
            note: notes[0],
            comments,
            votes,
            voteSummary,
            userVote: userVote ? userVote.vote : null
        });
    } catch (error) {
        console.error('Get decision error:', error);
        res.status(500).json({ error: 'Karar detayı alınamadı.' });
    }
});


router.post('/', authenticate, async (req, res) => {
    try {
        const { branch_id, title, content, note_type, priority } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Başlık ve içerik zorunludur.' });
        }

        const [result] = await db.execute(`
            INSERT INTO decision_notes (branch_id, user_id, title, content, note_type, priority)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [branch_id || null, req.user.id, title, content, note_type || 'insight', priority || 'medium']);

        res.status(201).json({
            message: 'Karar notu oluşturuldu.',
            id: result.insertId
        });
    } catch (error) {
        console.error('Create decision error:', error);
        res.status(500).json({ error: 'Karar notu oluşturulamadı.' });
    }
});


router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        
        const [notes] = await db.execute('SELECT * FROM decision_notes WHERE id = ?', [id]);

        if (notes.length === 0) {
            return res.status(404).json({ error: 'Karar notu bulunamadı.' });
        }

        const note = notes[0];

        
        if (note.user_id !== req.user.id && req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Bu notu silme yetkiniz yok.' });
        }

        
        await db.execute('DELETE FROM decision_comments WHERE note_id = ?', [id]);
        await db.execute('DELETE FROM decision_votes WHERE note_id = ?', [id]);
        await db.execute('DELETE FROM decision_notes WHERE id = ?', [id]);

        res.json({ message: 'Karar notu silindi.' });
    } catch (error) {
        console.error('Delete decision error:', error);
        res.status(500).json({ error: 'Karar notu silinemedi.' });
    }
});


router.put('/:id/status', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['open', 'in_review', 'approved', 'rejected', 'implemented'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Geçersiz durum.' });
        }

        await db.execute('UPDATE decision_notes SET status = ? WHERE id = ?', [status, id]);

        res.json({ message: 'Durum güncellendi.', status });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ error: 'Durum güncellenemedi.' });
    }
});


router.post('/:id/comments', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { comment } = req.body;

        if (!comment) {
            return res.status(400).json({ error: 'Yorum zorunludur.' });
        }

        const [result] = await db.execute(`
            INSERT INTO decision_comments (note_id, user_id, comment)
            VALUES (?, ?, ?)
        `, [id, req.user.id, comment]);

        res.status(201).json({
            message: 'Yorum eklendi.',
            id: result.insertId
        });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ error: 'Yorum eklenemedi.' });
    }
});


router.delete('/:noteId/comments/:commentId', authenticate, async (req, res) => {
    try {
        const { noteId, commentId } = req.params;

        
        const [comments] = await db.execute(
            'SELECT * FROM decision_comments WHERE id = ? AND note_id = ?',
            [commentId, noteId]
        );

        if (comments.length === 0) {
            return res.status(404).json({ error: 'Yorum bulunamadı.' });
        }

        const comment = comments[0];

        
        if (comment.user_id !== req.user.id && req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Bu yorumu silme yetkiniz yok.' });
        }

        await db.execute('DELETE FROM decision_comments WHERE id = ?', [commentId]);

        res.json({ message: 'Yorum silindi.' });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ error: 'Yorum silinemedi.' });
    }
});


router.post('/:id/vote', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { vote } = req.body;

        const validVotes = ['approve', 'reject', 'neutral'];
        if (!validVotes.includes(vote)) {
            return res.status(400).json({ error: 'Geçersiz oy.' });
        }

        
        await db.execute(`
            INSERT INTO decision_votes (note_id, user_id, vote)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE vote = ?
        `, [id, req.user.id, vote, vote]);

        
        const [votes] = await db.execute(`
            SELECT 
                SUM(vote = 'approve') as approve_count,
                SUM(vote = 'reject') as reject_count,
                SUM(vote = 'neutral') as neutral_count,
                COUNT(*) as total
            FROM decision_votes WHERE note_id = ?
        `, [id]);

        res.json({
            message: 'Oyunuz kaydedildi.',
            userVote: vote,
            voteSummary: votes[0]
        });
    } catch (error) {
        console.error('Vote error:', error);
        res.status(500).json({ error: 'Oy kaydedilemedi.' });
    }
});


router.get('/stats/summary', authenticate, async (req, res) => {
    try {
        const [stats] = await db.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(status = 'open') as open_count,
                SUM(status = 'in_review') as review_count,
                SUM(status = 'approved') as approved_count,
                SUM(status = 'implemented') as implemented_count,
                SUM(priority = 'critical') as critical_count,
                SUM(priority = 'high') as high_priority_count
            FROM decision_notes
        `);

        res.json({ stats: stats[0] });
    } catch (error) {
        console.error('Get decision stats error:', error);
        res.status(500).json({ error: 'İstatistikler alınamadı.' });
    }
});

module.exports = router;
