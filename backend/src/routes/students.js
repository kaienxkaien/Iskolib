const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { verifyToken, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', verifyToken, adminOnly, async (req, res) => {
    try {
        const [students] = await db.query(
            `SELECT id, student_id AS studentId, full_name AS fullName,
            username, course,
            (SELECT COALESCE(SUM(quantity),0) FROM loans
             WHERE loans.user_id = users.id AND loans.status != 'returned') AS borrowedCount
            FROM users
            WHERE role='student' AND is_active=1`
        );

        res.json({ students });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/', verifyToken, adminOnly, async (req, res) => {
    try {
        const { studentId, fullName, username, course, password } = req.body;

        const hash = await bcrypt.hash(password, 10);

        await db.query(
            `INSERT INTO users
            (student_id, full_name, username, password, role, course)
            VALUES (?, ?, ?, ?, 'student', ?)`,
            [studentId, fullName, username, hash, course]
        );

        res.status(201).json({
            message: 'Student registered successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
    try {
        await db.query(
            "UPDATE users SET is_active=0 WHERE id=? AND role='student'",
            [req.params.id]
        );

        res.json({ message: 'Student deactivated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;