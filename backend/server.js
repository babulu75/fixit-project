require('dotenv').config();
const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({ origin: '*' }));

// MySQL Connection Pooling
const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Test MySQL connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
    } else {
        console.log('Connected to MySQL database');
        connection.release();
    }
});

// Handle MySQL connection errors
pool.on('error', (err) => {
    console.error('MySQL pool error:', err);
});

// Signup Endpoint
app.post('/signup', async (req, res) => {
    const { name, email, phone, password } = req.body;

    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const query = 'INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)';
        pool.query(query, [name, email, phone, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ message: 'Email already registered.' });
                }
                console.error('Signup error:', err);
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
        const query = 'SELECT id, name, email, password FROM users WHERE email = ?';
        pool.query(query, [email], async (err, results) => {
            if (err) {
                console.error('Login error:', err);
                return res.status(500).json({ message: 'Error logging in. Please try again.' });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: 'User not found.' });
            }

            const user = results[0];

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Invalid password.' });
            }

            res.status(200).json({ 
                message: 'Login successful!', 
                user: { id: user.id, name: user.name, email: user.email } 
            });
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start the server
const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
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


app.get('/user/:id', (req, res) => {
    const userId = req.params.id;

    const query = 'SELECT name FROM users WHERE id = ?';
    pool.query(query, [userId], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        // Example services (Replace with real DB data)
        const services = [
            { id: 1, name: "Plumbing", description: "Fix leaky taps and pipes" },
            { id: 2, name: "Electrical", description: "Repair wiring and electrical issues" },
            { id: 3, name: "Cleaning", description: "Professional home cleaning services" }
        ];

        res.json({ name: results[0].name, services });
    });
});
