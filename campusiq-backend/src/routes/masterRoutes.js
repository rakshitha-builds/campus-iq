const express = require('express');
const router = express.Router();
const { verifyToken, isSuperAdmin } = require('../middleware/auth');
const {
  getBuildings, addBuilding, updateBuilding, deleteBuilding,
  getBlocks, addBlock, updateBlock, deleteBlock,
  getFloors, addFloor, updateFloor, deleteFloor,
  getDepartments, addDepartment, updateDepartment, deleteDepartment,
  getCategories, addCategory, updateCategory, deleteCategory,
  getDesignations, addDesignation, updateDesignation, deleteDesignation,
  getFloorInfoPublic,
  getFloorFacilities, addFloorFacility, updateFloorFacility, deleteFloorFacility
} = require('../controllers/masterController');

router.get('/floors/:id/info-public', getFloorInfoPublic);

router.get('/floors/:floorId/facilities', verifyToken, getFloorFacilities);
router.post('/floors/:floorId/facilities', verifyToken, isSuperAdmin, addFloorFacility);
router.put('/facilities/:id', verifyToken, isSuperAdmin, updateFloorFacility);
router.delete('/facilities/:id', verifyToken, isSuperAdmin, deleteFloorFacility);

router.get('/buildings', verifyToken, getBuildings);
router.post('/buildings', verifyToken, isSuperAdmin, addBuilding);
router.put('/buildings/:id', verifyToken, isSuperAdmin, updateBuilding);
router.delete('/buildings/:id', verifyToken, isSuperAdmin, deleteBuilding);

router.get('/blocks', verifyToken, getBlocks);
router.post('/blocks', verifyToken, isSuperAdmin, addBlock);
router.put('/blocks/:id', verifyToken, isSuperAdmin, updateBlock);
router.delete('/blocks/:id', verifyToken, isSuperAdmin, deleteBlock);

router.get('/floors', verifyToken, getFloors);
router.post('/floors', verifyToken, isSuperAdmin, addFloor);
router.put('/floors/:id', verifyToken, isSuperAdmin, updateFloor);
router.delete('/floors/:id', verifyToken, isSuperAdmin, deleteFloor);

router.get('/departments', verifyToken, getDepartments);
router.post('/departments', verifyToken, isSuperAdmin, addDepartment);
router.put('/departments/:id', verifyToken, isSuperAdmin, updateDepartment);
router.delete('/departments/:id', verifyToken, isSuperAdmin, deleteDepartment);

router.get('/categories', verifyToken, getCategories);
router.get('/categories/public', getCategories);
router.post('/categories', verifyToken, isSuperAdmin, addCategory);
router.put('/categories/:id', verifyToken, isSuperAdmin, updateCategory);
router.delete('/categories/:id', verifyToken, isSuperAdmin, deleteCategory);

router.get('/designations', verifyToken, getDesignations);
router.post('/designations', verifyToken, isSuperAdmin, addDesignation);
router.put('/designations/:id', verifyToken, isSuperAdmin, updateDesignation);
router.delete('/designations/:id', verifyToken, isSuperAdmin, deleteDesignation);

module.exports = router;