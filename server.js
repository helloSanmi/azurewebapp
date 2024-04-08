require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const sql = require('mssql');
const cors = require('cors');


const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files from 'public' directory
app.use(cors()); // Enable CORS for all routes

// Azure SQL Database configuration
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    server: process.env.DB_SERVER,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: true, // Necessary for Azure SQL Database
        trustServerCertificate: false // Change to true if necessary for your environment
    }
};

// Connect to your database
const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log('Connected to MSSQL');
        return pool;
    })
    .catch(err => console.log('Database Connection Failed! Bad Config: ', err));

// Routes
// GET route to fetch all messages
app.get('/messages', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Messages ORDER BY CreatedAt DESC');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST route to submit a new message
app.post('/messages', async (req, res) => {
    const { name, message } = req.body;
    if (!name || !message) {
        return res.status(400).json({ error: 'Name and message are required' });
    }

    try {
        const pool = await poolPromise;
        await pool.request()
            .query(`INSERT INTO Messages (Name, Message) VALUES ('${name}', '${message}')`);
        res.status(201).json({ message: 'Message added successfully' });
    } catch (err) {
        console.error('SQL error', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
