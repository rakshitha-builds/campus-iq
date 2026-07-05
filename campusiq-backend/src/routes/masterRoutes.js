const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth');
const {
  getBuildings, addBuilding, updateBuilding, deleteBuilding,
  getBlocks, addBlock, updateBlock, deleteBlock,
  getFloors, addFloor, updateFloor, deleteFloor,
  getDepartments, addDepartment, updateDepartment, deleteDepartment,
  getCategories, addCategory, updateCategory, deleteCategory,
  getDesignations, addDesignation, updateDesignation, deleteDesignation
} = require('../controllers/masterController');

router.get('/buildings', verifyToken, getBuildings);
router.post('/buildings', verifyToken, isAdmin, addBuilding);
router.put('/buildings/:id', verifyToken, isAdmin, updateBuilding);
router.delete('/buildings/:id', verifyToken, isAdmin, deleteBuilding);

router.get('/blocks', verifyToken, getBlocks);
router.post('/blocks', verifyToken, isAdmin, addBlock);
router.put('/blocks/:id', verifyToken, isAdmin, updateBlock);
router.delete('/blocks/:id', verifyToken, isAdmin, deleteBlock);

router.get('/floors', verifyToken, getFloors);
router.post('/floors', verifyToken, isAdmin, addFloor);
router.put('/floors/:id', verifyToken, isAdmin, updateFloor);
router.delete('/floors/:id', verifyToken, isAdmin, deleteFloor);

router.get('/departments', verifyToken, getDepartments);
router.post('/departments', verifyToken, isAdmin, addDepartment);
router.put('/departments/:id', verifyToken, isAdmin, updateDepartment);
router.delete('/departments/:id', verifyToken, isAdmin, deleteDepartment);

router.get('/categories', verifyToken, getCategories);
router.post('/categories', verifyToken, isAdmin, addCategory);
router.put('/categories/:id', verifyToken, isAdmin, updateCategory);
router.delete('/categories/:id', verifyToken, isAdmin, deleteCategory);

router.get('/designations', verifyToken, getDesignations);
router.post('/designations', verifyToken, isAdmin, addDesignation);
router.put('/designations/:id', verifyToken, isAdmin, updateDesignation);
router.delete('/designations/:id', verifyToken, isAdmin, deleteDesignation);

module.exports = router;