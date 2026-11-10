const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const [users] = await db.query(
            'SELECT * FROM users WHERE username = ? AND is_active = 1',
            [username]
        );

        if (!users.length) {
            return res.status(401).json({
                message: 'Invalid username or password.'
            });
        }

        const user = users[0];

        const stored = user.password || '';
        let valid;

        if (stored.startsWith('$2')) {
            valid = await bcrypt.compare(password, stored);
        } else {
            // Legacy plain-text password: accept it once, then upgrade to a bcrypt hash.
            valid = password === stored;
            if (valid) {
                await db.query(
                    'UPDATE users SET password = ? WHERE id = ?',
                    [await bcrypt.hash(password, 10), user.id]
                );
            }
        }

        if (!valid) {
            return res.status(401).json({
                message: 'Invalid username or password.'
            });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.full_name,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;