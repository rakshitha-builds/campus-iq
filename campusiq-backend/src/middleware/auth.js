const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }
  const bearerToken = token.startsWith('Bearer ') ? token.slice(7) : token;
  try {
    const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const isSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Super Admin access required' });
  }
  next();
};

const isAdmin = (req, res, next) => {
  if (!['super_admin', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

module.exports = { verifyToken, isSuperAdmin, isAdmin };