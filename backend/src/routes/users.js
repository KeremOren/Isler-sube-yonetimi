const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();


router.get('/', authenticate, authorize('Admin'), async (req, res) => {
    try {
        const [users] = await db.execute(`
            SELECT id, name, email, role, created_at, updated_at
            FROM users
            ORDER BY created_at DESC
        `);

        res.json({ users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Kullanıcılar alınamadı.' });
    }
});


router.post('/', authenticate, authorize('Admin'), async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'İsim, e-posta ve şifre zorunludur.' });
        }

        
        const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Bu e-posta adresi zaten kullanılıyor.' });
        }

        
        const validRoles = ['Admin', 'Manager', 'Viewer'];
        const userRole = validRoles.includes(role) ? role : 'Viewer';

        
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.execute(`
            INSERT INTO users (name, email, password, role)
            VALUES (?, ?, ?, ?)
        `, [name, email, hashedPassword, userRole]);

        res.status(201).json({
            message: 'Kullanıcı oluşturuldu.',
            user: {
                id: result.insertId,
                name,
                email,
                role: userRole
            }
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Kullanıcı oluşturulamadı.' });
    }
});


router.put('/:id', authenticate, authorize('Admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, role, password } = req.body;

        
        const [existing] = await db.execute('SELECT id FROM users WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }

        
        if (email) {
            const [emailCheck] = await db.execute(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [email, id]
            );
            if (emailCheck.length > 0) {
                return res.status(400).json({ error: 'Bu e-posta adresi başka bir kullanıcı tarafından kullanılıyor.' });
            }
        }

        
        let updateFields = [];
        let params = [];

        if (name) {
            updateFields.push('name = ?');
            params.push(name);
        }
        if (email) {
            updateFields.push('email = ?');
            params.push(email);
        }
        if (role && ['Admin', 'Manager', 'Viewer'].includes(role)) {
            updateFields.push('role = ?');
            params.push(role);
        }
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateFields.push('password = ?');
            params.push(hashedPassword);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'Güncellenecek alan belirtilmedi.' });
        }

        params.push(id);
        await db.execute(
            `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
            params
        );

        res.json({ message: 'Kullanıcı güncellendi.' });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Kullanıcı güncellenemedi.' });
    }
});


router.delete('/:id', authenticate, authorize('Admin'), async (req, res) => {
    try {
        const { id } = req.params;

        
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'Kendi hesabınızı silemezsiniz.' });
        }

        
        const [existing] = await db.execute('SELECT id FROM users WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }

        await db.execute('DELETE FROM users WHERE id = ?', [id]);

        res.json({ message: 'Kullanıcı silindi.' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Kullanıcı silinemedi.' });
    }
});


router.get('/stats', authenticate, authorize('Admin'), async (req, res) => {
    try {
        const [stats] = await db.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(role = 'Admin') as admin_count,
                SUM(role = 'Manager') as manager_count,
                SUM(role = 'Viewer') as viewer_count
            FROM users
        `);

        res.json({ stats: stats[0] });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({ error: 'İstatistikler alınamadı.' });
    }
});

module.exports = router;
