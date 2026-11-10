const express = require('express');
const db = require('../db');
const { verifyToken, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
    try {
        const [books] = await db.query(
            `SELECT id, isbn, title, author, genre,
            total_copies AS totalCopies,
            available_copies AS availableCopies
            FROM books WHERE title LIKE ? OR author LIKE ?`,
            [`%${req.query.q || ''}%`, `%${req.query.q || ''}%`]
        );

        res.json({ books });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/', verifyToken, adminOnly, async (req, res) => {
    try {
        const { isbn, title, author, genre, quantity } = req.body;

        const [result] = await db.query(
            `INSERT INTO books
            (isbn, title, author, genre, total_copies, available_copies)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [isbn || null, title, author, genre, quantity, quantity]
        );

        res.status(201).json({
            message: 'Book added successfully',
            id: result.insertId
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/:id', verifyToken, adminOnly, async (req, res) => {
    try {
        const { isbn, title, author, genre, quantity } = req.body;

        const [result] = await db.query(
            `UPDATE books SET isbn=?, title=?, author=?, genre=?,
            available_copies=available_copies + ? - total_copies,
            total_copies=? WHERE id=?`,
            [isbn || null, title, author, genre,
             quantity, quantity, req.params.id]
        );

        res.json({ message: 'Book updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
    try {
        await db.query('DELETE FROM books WHERE id=?', [req.params.id]);
        res.json({ message: 'Book deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;