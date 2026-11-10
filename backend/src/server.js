require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const db = require('./db');
const { verifyToken, adminOnly } = require('./middleware/auth');

const app = express();

app.use(cors());
app.use(express.json());

// ---- API ----
app.get('/api/health', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.json({ status: 'success', database: 'connected' });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            database: 'disconnected',
            message: error.message
        });
    }
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/books', require('./routes/books'));
app.use('/api/students', require('./routes/students'));
app.use('/api/loans', require('./routes/loans'));

// Dashboard numbers (admin)
app.get('/api/stats', verifyToken, adminOnly, async (req, res) => {
    try {
        const [[books]] = await db.query(
            'SELECT COALESCE(SUM(total_copies),0) AS n FROM books'
        );
        const [[students]] = await db.query(
            "SELECT COUNT(*) AS n FROM users WHERE role='student' AND is_active=1"
        );
        const [[borrowed]] = await db.query(
            "SELECT COALESCE(SUM(quantity),0) AS n FROM loans WHERE status != 'returned'"
        );
        res.json({
            totalBooks: Number(books.n),
            totalStudents: Number(students.n),
            borrowedBooks: Number(borrowed.n)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ---- Front end (served from the same origin, so open http://localhost:3000) ----
const root = path.join(__dirname, '..', '..');
app.use('/assets', express.static(path.join(root, 'assets')));
app.use(express.static(path.join(root, 'frontend'), { etag: false, maxAge: 0 }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`IskoLib running at http://localhost:${PORT}`);
});
