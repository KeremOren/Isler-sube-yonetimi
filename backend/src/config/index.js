require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',

    db: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'isler_kitabevi',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    },

    jwt: {
        secret: process.env.JWT_SECRET || 'default_secret_change_in_production',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    },

    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true
    }
};
