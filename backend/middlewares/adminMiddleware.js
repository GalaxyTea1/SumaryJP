const User = require('../models/userModel');

/**
 * Admin middleware — kiểm tra user có role 'admin' hay không.
 * Phải dùng SAU authMiddleware (cần req.user từ JWT).
 */
const adminMiddleware = async (req, res, next) => {
    if (!req.user || !req.user.id) {
        return res.status(403).json({ error: 'Truy cập bị từ chối. Bạn không có quyền Admin.' });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ error: 'Truy cập bị từ chối. Bạn không có quyền Admin.' });
        }
        next();
    } catch (error) {
        console.error('Admin permission check failed:', error);
        res.status(500).json({ error: 'Lỗi máy chủ khi kiểm tra quyền Admin.' });
    }
};

module.exports = adminMiddleware;
