const { Pool } = require('pg');

const pgMainConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
};

const pool = new Pool(pgMainConfig);

module.exports = pool;