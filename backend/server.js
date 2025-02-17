const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000; // Use environment variable for port

// Middleware
app.use(express.json());
app.use(cors({ origin: '*' }));

// Serve static files from the frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// MySQL Connection Pooling
const pool = mysql.createPool({
    connectionLimit: 10, // Adjust based on your needs
    host: process.env.DB_HOST || 'sql12.freesqldatabase.com',
    user: process.env.DB_USER || 'sql12763007',
    password: process.env.DB_PASSWORD || '2UXAwVJiTu',
    database: process.env.DB_NAME || 'sql12763007'
});

// Test the database connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
    } else {
        console.log('Connected to MySQL database');
        connection.release(); // Release the connection back to the pool
    }
});

// Handle database errors
pool.on('error', (err) => {
    console.error('MySQL pool error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
        console.log('Reconnecting to MySQL...');
        pool.getConnection((err, connection) => {
            if (err) {
                console.error('Error reconnecting to MySQL:', err);
            } else {
                console.log('Reconnected to MySQL');
                connection.release();
            }
        });
    } else {
        throw err;
    }
});

// Signup Endpoint
app.post('/signup', async (req, res) => {
    const { name, email, phone, password } = req.body;

    try {
        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert user into the database
        const query = 'INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)';
        pool.query(query, [name, email, phone, hashedPassword], (err, result) => {
            if (err) {
                console.error('Error signing up:', err);
                return res.status(500).json({ message: 'Error signing up. Please try again.' });
            }
            res.status(201).json({ message: 'Signup successful! You can now log in.' });
        });
    } catch (err) {
        console.error('Error hashing password:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Login Endpoint
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user by email
        const query = 'SELECT * FROM users WHERE email = ?';
        pool.query(query, [email], async (err, results) => {
            if (err) {
                console.error('Error logging in:', err);
                return res.status(500).json({ message: 'Error logging in. Please try again.' });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: 'User not found.' });
            }

            const user = results[0];

            // Compare passwords
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Invalid password.' });
            }

            res.status(200).json({ message: 'Login successful!', user: { id: user.id, name: user.name, email: user.email } });
        });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Serve the frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start the server
const server = app.listen(port, () => {
    console.log(`Server running on https://fixit-l2jp.onrender.com:${port}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    pool.end((err) => {
        if (err) {
            console.error('Error closing MySQL pool:', err);
        } else {
            console.log('MySQL pool closed.');
        }
        server.close(() => {
            console.log('Server shut down.');
            process.exit(0);
        });
    });
});