const mysql = require('mysql2/promise');
const config = require('./index');

const pool = mysql.createPool(config.db);

// Test connection
pool.getConnection()
    .then(connection => {
        console.log('✅ Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err.message);
    });

module.exports = pool;
