const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET is not set in environment variables.');
}

const optionalAuthMiddleware = (req, _res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.replace('Bearer ', '');

    try {
        req.user = jwt.verify(token, JWT_SECRET);
    } catch {
        req.user = null;
    }

    next();
};

module.exports = optionalAuthMiddleware;
