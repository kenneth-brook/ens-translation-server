require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const bodyParser = require('body-parser');
const mssql = require('mssql');
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
let dataPoolRes = {};
let runs = 0;
let dbType = ""

function syncMatrix() {
    runs++;
    clientPoolRes.forEach(obj => {
        switch (obj.db_type) {
            case 'mssql':
              handleMSSQL(obj);
              break;
            case 'mysql':
              handleMySQL(obj);
              break;
            case 'postgres':
              handlePostgres(obj);
              break;
            default:
              console.log('Unsupported db_type:', obj.db_type);
        }
    })
}

cron.schedule('*/5 * * * *', () => {
    startFunction();
});

app.use(bodyParser.json());
app.use(cors());

app.get('/translation-host/check', (req, res) => {
    res.send(dataPoolRes);
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);

    startFunction();
});

async function startFunction() {
    try {
        const result = await clientPool.query("SELECT * FROM clients WHERE dbsync = 'active'");
        clientPoolRes = result.rows;
        syncMatrix();
    } catch (error) {
        console.error('Error executing query', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function handleMSSQL(obj) {
    dbType = obj.db_type;
    const mssqlConfig = {
        user: obj.raw_user,
        password: obj.raw_pass,
        server: obj.raw_server,
        database: obj.raw_table,
    };

    try {
        // Connect to the MSSQL database
        await mssql.connect(mssqlConfig);
    
        // Query to retrieve all data from the specified table
        const queryResult = await mssql.query`SELECT * FROM ${obj.raw_table_name}`;
    
        // Disconnect from the MSSQL database
        await mssql.close();
    
        // Return the result as JSON
        dataPoolRes = queryResult.recordset;
    } catch (error) {
        console.error('Error:', error.message);
        throw error;
    }
}

async function handleMySQL(obj) {

}

async function handlePostgres(obj) {

}




/*const dataPool = new Pool({
    user: process.env.PG_USERNAME,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: 5432, // Default PostgreSQL port
});*/