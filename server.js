require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const sql = require('mssql');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static('public'));


// Database configuration for Azure SQL Database
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
        encrypt: true,
        trustServerCertificate: false
    }
};

// Connect to database
sql.connect(dbConfig).then(pool => {
    if (pool.connecting) console.log('Connecting to the Azure SQL Database...');
    if (pool.connected) console.log('Connected to Azure SQL Database');
}).catch(err => {
    console.error('Failed to connect to the database:', err);
});

app.use(express.json());

app.use(cors({
    origin: ['https://azurewebapplearncode.azurewebsites.net', 'http://localhost:3000/'], // Update with your frontend server's address if different
    credentials: true,
}));

// Signup route
app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 8);

    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('username', sql.NVarChar, username)
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, hashedPassword)
            .query('INSERT INTO users (username, email, password) VALUES (@username, @email, @password)');

        res.status(201).send('User created');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error registering new user');
    }
});

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT * FROM users WHERE username = @username');

        if (result.recordset.length === 0 || !(await bcrypt.compare(password, result.recordset[0].password))) {
            return res.status(401).send('Authentication failed');
        }

        const user = result.recordset[0];
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Ensure this includes 'username: user.username'
        res.status(200).json({ token, username: user.username }); // Confirm this line is correct
    } catch (err) {
        console.error('Database query failed:', err);
        res.status(500).send('Error logging in');
    }
});



// Middleware to verify token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).send("A token is required for authentication");
    }
    const token = authHeader.split(' ')[1]; // Extract token from Bearer

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
    } catch (err) {
        return res.status(401).send("Invalid Token");
    }
    return next();
};


// Add a new note
app.post('/notes', verifyToken, async (req, res) => {
    const { title, content } = req.body;
    const userId = req.user.id; // Assuming this is correctly extracted from the token

    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('userId', sql.Int, userId)
            .input('title', sql.NVarChar, title)
            .input('content', sql.NVarChar, content)
            .query('INSERT INTO notes (userId, title, content) VALUES (@userId, @title, @content)');

        res.status(201).send('Note added');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error adding note');
    }
});


// Retrieve all notes for the logged-in user
app.get('/notes', verifyToken, async (req, res) => {
    const userId = req.user.id; // Extracted from the token

    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query('SELECT * FROM notes WHERE userId = @userId');

        res.json(result.recordset);
    } catch (err) {
        console.error('Database query failed:', err);
        res.status(500).send('Error retrieving notes');
    }
});


// Edit a note
app.put('/notes/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    const userId = req.user.id;

    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('id', sql.Int, id)
            .input('userId', sql.Int, userId)
            .input('title', sql.NVarChar, title)
            .input('content', sql.NVarChar, content)
            .query('UPDATE notes SET title = @title, content = @content WHERE id = @id AND userId = @userId');

        res.status(200).send('Note updated successfully');
    } catch (err) {
        console.error('Database query failed:', err);
        res.status(500).send('Error updating note');
    }
});


// Delete a note
app.delete('/notes/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('id', sql.Int, id)
            .input('userId', sql.Int, userId)
            .query('DELETE FROM notes WHERE id = @id AND userId = @userId');

        res.status(200).send('Note deleted successfully');
    } catch (err) {
        console.error('Database query failed:', err);
        res.status(500).send('Error deleting note');
    }
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));