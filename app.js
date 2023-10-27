require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mssql = require('mssql');

const app = express();
const cron = require('node-cron');
const port = process.env.PORT;

const clientPool = require('./pgMainConfig');

let clientPoolRes = {};
let dataPoolRes = {};
let runs = 0;
let dbType = ""
let sourceConfigObject ={}

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
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

app.get('/translation-host/check', (req, res) => {
    startFunction();
    res.send([dataPoolRes, JSON.stringify(clientPoolRes)]);
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

function handleMSSQL(obj) {
    const sourceConfigObject = {
        /*user:  'admin365', // sql user
        password:  'MzmEG21PQSMDW4qXPsQF', //sql user password
        server:  'database-911.cfzb4vlbttqg.us-east-2.rds.amazonaws.com', // if it does not work try- localhost
        database:  'hc911_db',
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        },
        options: { 
            trustServerCertificate: true,
            Encrypt: true,
        },*/
        user:`${obj.raw_user}`,
        password:`${obj.raw_pass}`,
        server:`${obj.raw_server}`,
        database:`${obj.raw_table}`,
        options: {
            encrypt: true, // Enable encryption (if required)
            trustServerCertificate: true,
        },
    };

    //dataPoolRes = JSON.stringify(sourceConfigObject);
    
    try {
        let confBundle = mssql.connect(sourceConfigObject);
        let queryResult = confBundle.request().query("SELECT * from active_incidents WHERE type != 'ACTIVE' AND type != 'CHIABU' AND type != 'ARRWAR' AND type != '54733.57BO' AND type != 'BOLO' AND type != 'BOMREC' AND type != 'BOMBREC' AND type != 'BOMTHR' AND type != 'DOA' AND type != 'DOAHOS' AND type != 'DOATR' AND type != 'EMERG' AND type != 'EDRILL' AND type != 'EINFO' AND type != 'EPSTBY' AND type != 'ESPAS' AND type != 'ETEST' AND type != 'FDRILL' AND type != 'FASPOL' AND type != 'FINFO' AND type != 'FTEST' AND type != 'HELPE' AND type != 'HELPF' AND type != 'HELPO' AND type != 'HELPP' AND type != 'HOSTAG' AND type != 'HYDRAN' AND type != 'MENTAL' AND type != 'NUCINC' AND type != 'PINFO' AND type != 'PSYCH' AND type != 'PTEST1' AND type != 'PTEST2' AND type != 'PTEST3' AND type != 'PW' AND type != 'RAPE' AND type != 'RAPATT' AND type != 'SEXEXP' AND type != 'SEXMED' AND type != 'SEXOFF' AND type != 'SHOOTER' AND type != 'SIREN' AND type != 'SRCHWR' AND type != 'SIA' AND type != 'SPRINK' AND type != 'SUIATT' AND type != 'SUICID' AND type != 'SUITHR' AND type != 'SUSPAK' AND type != 'TAZED' AND type != 'TEST' AND type != 'TRANSA' AND type != 'TRANSJ' AND type != 'TRAFFIC' AND type != 'WARSER' AND type != 'WATCH' AND type != 'PSPAS' AND type != 'HELPPD' AND type != 'ASSIP' AND type != 'AUTFIP' AND type != 'BURGIP' AND type != 'DISPREV' AND type != 'DOMASLT' AND type != 'DOMVIO' AND type != 'FIGHT' AND type != 'HOMIVA' AND type != 'ROBBUS' AND type != 'ROBIP' AND type != 'ALABUR' AND type != 'SUSPER' AND type != 'SUSVEH' AND type != 'SUSACT' AND type != 'THEFIP' AND jurisdiction != 'Soddy Daisy PD' AND jurisdiction != 'Lookout Mountain PD' AND jurisdiction != 'UTC' AND jurisdiction != 'Soddy Daisy FD' AND jurisdiction != 'Lookout Mountain PD' AND location != '2600 IGOU FERRY RD' ORDER BY creation DESC");
        dataPoolRes = JSON.stringify(queryResult.recordset);
    } catch (error) {
        dataPoolRes = JSON.stringify(error.message)
        console.error('Error:', error.message);
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