const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const config = require('../config');
const { authenticate } = require('../middleware/auth');

const router = express.Router();


router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'E-posta ve şifre gereklidir.' });
        }

        
        const [users] = await db.execute(
            'SELECT id, name, email, password, role FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Geçersiz e-posta veya şifre.' });
        }

        const user = users[0];

        
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Geçersiz e-posta veya şifre.' });
        }

        
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Giriş sırasında bir hata oluştu.' });
    }
});


router.get('/me', authenticate, async (req, res) => {
    try {
        const [users] = await db.execute(
            'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }

        res.json({ user: users[0] });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Kullanıcı bilgileri alınamadı.' });
    }
});


router.post('/change-password', authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Mevcut şifre ve yeni şifre gereklidir.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Yeni şifre en az 6 karakter olmalıdır.' });
        }

        
        const [users] = await db.execute(
            'SELECT password FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }

        
        const isValidPassword = await bcrypt.compare(currentPassword, users[0].password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Mevcut şifre yanlış.' });
        }

        
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        
        await db.execute(
            'UPDATE users SET password = ? WHERE id = ?',
            [newPasswordHash, req.user.id]
        );

        res.json({ success: true, message: 'Şifre başarıyla değiştirildi.' });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Şifre değiştirme sırasında bir hata oluştu.' });
    }
});

module.exports = router;
