require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const sql = require('mssql');
const cors = require('cors');

// Validate critical environment variables at startup
if (!process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME || !process.env.DB_SERVER) {
    console.error('Fatal Error: One or more database configuration environment variables are not set.');
    process.exit(1);
}

const app = express();
const port = process.env.PORT || 3000;

// CORS Configuration
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' ? 
            ['https://azurewebapplearncode.azurewebsites.net'] : 
            ['http://localhost:3000', 'https://azurewebapplearncode.azurewebsites.net'],
    credentials: true
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files from 'public' directory

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
        trustServerCertificate: false
    }
};

// Connect to your database
const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log('Connected to MSSQL');
        return pool;
    })
    .catch(err => {
        console.error('Database Connection Failed! Bad Config: ', err);
        process.exit(1); // Exit if cannot connect to database
    });

// Routes
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

app.post('/messages', async (req, res) => {
    const { name, message } = req.body;
    if (!name || !message) {
        return res.status(400).json({ error: 'Name and message are required' });
    }

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('Name', sql.VarChar, name)
            .input('Message', sql.VarChar, message)
            .query('INSERT INTO Messages (Name, Message) VALUES (@Name, @Message)');
        res.status(201).json({ message: 'Message added successfully' });
    } catch (err) {
        console.error('SQL error', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
