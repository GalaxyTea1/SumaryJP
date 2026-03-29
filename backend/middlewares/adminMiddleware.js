const authMiddleware = require('./authMiddleware');

/**
 * Admin middleware — kiểm tra user có role 'admin' hay không.
 * Phải dùng SAU authMiddleware (cần req.user từ JWT).
 */
const adminMiddleware = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Truy cập bị từ chối. Bạn không có quyền Admin.' });
    }
    next();
};

module.exports = adminMiddleware;
