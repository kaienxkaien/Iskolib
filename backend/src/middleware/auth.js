const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const header = req.headers.authorization;

    if (!header) {
        return res.status(401).json({
            message: 'Please log in first.'
        });
    }

    const token = header.split(' ')[1];

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        res.status(401).json({
            message: 'Invalid or expired token.'
        });
    }
}

function adminOnly(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            message: 'Admin access only.'
        });
    }

    next();
}

module.exports = { verifyToken, adminOnly };