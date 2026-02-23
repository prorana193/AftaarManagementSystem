const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const USER_PASSWORD = process.env.USER_PASSWORD || 'user123';

const login = async (req, res) => {
  try {
    const { password, role } = req.body;

    if (!password || !role) {
      return res.status(400).json({ message: 'Password and role are required.' });
    }

    if (role === 'admin') {
      if (password === ADMIN_PASSWORD) {
        const token = generateToken('admin');
        return res.json({ token, role: 'admin', message: 'Admin login successful.' });
      }
      return res.status(401).json({ message: 'Invalid admin password.' });
    }

    if (role === 'user') {
      if (password === USER_PASSWORD) {
        const token = generateToken('user');
        return res.json({ token, role: 'user', message: 'User login successful.' });
      }
      return res.status(401).json({ message: 'Invalid user password.' });
    }

    return res.status(400).json({ message: 'Invalid role.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const verifySession = async (req, res) => {
  res.json({ role: req.user.role, valid: true });
};

module.exports = { login, verifySession };
