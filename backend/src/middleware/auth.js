const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Authentication middleware - verifies JWT token
 */
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Erişim reddedildi. Token gerekli.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, config.jwt.secret);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token süresi dolmuş. Lütfen tekrar giriş yapın.' });
        }
        return res.status(401).json({ error: 'Geçersiz token.' });
    }
};

/**
 * Role-based authorization middleware
 * @param {string[]} roles - Allowed roles
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Yetkilendirme gerekli.' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Bu işlem için yetkiniz bulunmamaktadır.',
                required: roles,
                current: req.user.role
            });
        }

        next();
    };
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, config.jwt.secret);
            req.user = decoded;
        } catch (error) {
            // Token invalid, but continue without user
        }
    }

    next();
};

module.exports = {
    authenticate,
    authorize,
    optionalAuth
};
