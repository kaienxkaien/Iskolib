const express = require('express');
const db = require('../db');
const { verifyToken, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
    try {
        const [loans] = await db.query(
            `SELECT l.*, b.title AS bookTitle,
            b.author, u.full_name AS studentName
            FROM loans l
            JOIN books b ON l.book_id=b.id
            JOIN users u ON l.user_id=u.id
            WHERE l.status != 'returned'
            AND (? = 'admin' OR l.user_id = ?)`,
            [req.user.role, req.user.id]
        );

        res.json({ loans });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/', verifyToken, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ message: 'Students only.' });
    }

    const connection = await db.getConnection();

    try {
        const { bookId, quantity } = req.body;

        await connection.beginTransaction();

        const [books] = await connection.query(
            'SELECT * FROM books WHERE id=? FOR UPDATE',
            [bookId]
        );

        if (!books.length || books[0].available_copies < quantity || quantity < 1) {
            await connection.rollback();
            return res.status(400).json({
                message: 'Book unavailable or invalid quantity.'
            });
        }

        const due = new Date();
        due.setDate(due.getDate() + 7);

        await connection.query(
            `INSERT INTO loans (user_id, book_id, quantity, due_date)
            VALUES (?, ?, ?, ?)`,
            [req.user.id, bookId, quantity, due.toISOString().slice(0, 10)]
        );

        await connection.query(
            'UPDATE books SET available_copies=available_copies-? WHERE id=?',
            [quantity, bookId]
        );

        await connection.commit();

        res.status(201).json({ message: 'Book borrowed successfully.' });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        connection.release();
    }
});

router.post('/:id/return-request', verifyToken, async (req, res) => {
    try {
        const [result] = await db.query(
            `UPDATE loans SET status='returned_requested'
            WHERE id=? AND user_id=? AND status='borrowed'`,
            [req.params.id, req.user.id]
        );

        if (!result.affectedRows) {
            return res.status(400).json({ message: 'Loan not found.' });
        }

        res.json({ message: 'Return request sent.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/:id/return', verifyToken, adminOnly, async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [loans] = await connection.query(
            `SELECT * FROM loans WHERE id=?
            AND status='returned_requested' FOR UPDATE`,
            [req.params.id]
        );

        if (!loans.length) {
            await connection.rollback();
            return res.status(404).json({ message: 'Return request not found.' });
        }

        const loan = loans[0];

        await connection.query(
            `UPDATE loans SET status='returned', returned_at=NOW()
            WHERE id=?`,
            [loan.id]
        );

        await connection.query(
            `UPDATE books SET available_copies=available_copies+?
            WHERE id=?`,
            [loan.quantity, loan.book_id]
        );

        await connection.commit();

        res.json({ message: 'Book returned successfully.' });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        connection.release();
    }
});

module.exports = router;