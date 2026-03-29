const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET is not set in environment variables. Server cannot start.');
}

const authController = {
    async register(req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({ error: 'Vui lòng cung cấp cả Tên đăng nhập và Mật khẩu' });
            }

            // Check if user exists
            const existingUser = await User.findByUsername(username);
            if (existingUser) {
                return res.status(400).json({ error: 'Tên đăng nhập này đã tồn tại' });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Create new user in DB
            const newUser = await User.create(username, hashedPassword);

            // Auto generated JWT for quick login
            const token = jwt.sign({ id: newUser.id, username: newUser.username, role: newUser.role || 'user' }, JWT_SECRET, {
                expiresIn: '30d'
            });

            res.status(201).json({
                message: 'Đăng ký tài khoản thành công',
                user: newUser,
                token
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Lỗi máy chủ khi đăng ký' });
        }
    },

    async login(req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({ error: 'Yêu cầu Tên đăng nhập và Mật khẩu' });
            }

            // Find User
            const user = await User.findByUsername(username);
            if (!user) {
                return res.status(401).json({ error: 'Sai Tên đăng nhập hoặc Mật khẩu' });
            }

            // Compare passwords
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Sai Tên đăng nhập hoặc Mật khẩu' });
            }

            // Generate JWT
            const token = jwt.sign({ id: user.id, username: user.username, role: user.role || 'user' }, JWT_SECRET, {
                expiresIn: '30d' // Hạn sử dụng 30 ngày giống mock
            });

            res.status(200).json({
                message: 'Đăng nhập thành công',
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role || 'user',
                    current_streak: user.current_streak
                },
                token
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Lỗi máy chủ khi đăng nhập' });
        }
    },

    async getMe(req, res) {
        try {
            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ error: 'Không tìm thấy thông tin tài khoản' });
            }

            res.status(200).json({ user });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ error: 'Lỗi định dạng khi lấy hồ sơ người dùng' });
        }
    }
};

module.exports = authController;
