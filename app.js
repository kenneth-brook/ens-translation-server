require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const bodyParser = require('body-parser');
//const mssql = require('mssql');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const cron = require('node-cron');
const port = process.env.PORT;

const clientPool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
});

let clientPoolRes = {};

app.use(bodyParser.json());
app.use(cors());

app.get('/translation-host/check', (req, res) => {
    res.send(clientPoolRes);
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);

    startFunction();

    cron.schedule('*/5 * * * *', () => {
        startFunction();
    });
});

async function startFunction() {
    try {
        const pgClient = await clientPool.connect();
        const result = await pgClient.query('SELECT * FROM clients WHERE dbsync = "active"');
        clientPoolRes = result.rows;
        pgClient.release();
        //clientPoolRes = result.rows;
    } catch (error) {
        console.error('Error executing query', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}




/*const dataPool = new Pool({
    user: process.env.PG_USERNAME,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: 5432, // Default PostgreSQL port
});

const mssqlConfig = {
    user: process.env.MSSQL_USERNAME,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_SERVER,
    database: process.env.MSSQL_DATABASE,
};*/