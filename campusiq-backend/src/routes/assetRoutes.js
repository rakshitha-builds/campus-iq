const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth');
const { getAssets, addAsset, updateAsset, deleteAsset } = require('../controllers/assetController');

// Both super_admin and admin can view and manage assets, per the app's role model.
router.get('/', verifyToken, getAssets);
router.post('/', verifyToken, isAdmin, addAsset);
router.put('/:id', verifyToken, isAdmin, updateAsset);
router.delete('/:id', verifyToken, isAdmin, deleteAsset);

module.exports = router;