const pool = require('../config/db');

// BUILDINGS
const getBuildings = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM buildings ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const addBuilding = async (req, res) => {
  try {
    const { building_name } = req.body;
    const result = await pool.query(
      'INSERT INTO buildings (building_name) VALUES ($1) RETURNING *',
      [building_name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateBuilding = async (req, res) => {
  try {
    const { building_name } = req.body;
    const result = await pool.query(
      'UPDATE buildings SET building_name = $1 WHERE id = $2 RETURNING *',
      [building_name, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Building not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteBuilding = async (req, res) => {
  try {
    await pool.query('DELETE FROM buildings WHERE id = $1', [req.params.id]);
    res.json({ message: 'Building deleted' });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({ message: 'Cannot delete this building — it still has blocks linked to it. Delete those blocks first.' });
    }
    console.error('Delete building error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// BLOCKS
const getBlocks = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, bl.building_name FROM blocks b
       JOIN buildings bl ON b.building_id = bl.id ORDER BY b.id`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const addBlock = async (req, res) => {
  try {
    const { block_name, building_id } = req.body;
    const result = await pool.query(
      'INSERT INTO blocks (block_name, building_id) VALUES ($1, $2) RETURNING *',
      [block_name, building_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateBlock = async (req, res) => {
  try {
    const { block_name, building_id } = req.body;
    const result = await pool.query(
      'UPDATE blocks SET block_name = $1, building_id = $2 WHERE id = $3 RETURNING *',
      [block_name, building_id, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Block not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteBlock = async (req, res) => {
  try {
    await pool.query('DELETE FROM blocks WHERE id = $1', [req.params.id]);
    res.json({ message: 'Block deleted' });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({ message: 'Cannot delete this block — it still has floors linked to it. Delete those floors first.' });
    }
    console.error('Delete block error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// FLOORS
const getFloors = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT f.*, b.block_name FROM floors f
       JOIN blocks b ON f.block_id = b.id ORDER BY f.id`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const addFloor = async (req, res) => {
  try {
    const { floor_name, block_id } = req.body;
    const result = await pool.query(
      'INSERT INTO floors (floor_name, block_id) VALUES ($1, $2) RETURNING *',
      [floor_name, block_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateFloor = async (req, res) => {
  try {
    const { floor_name, block_id } = req.body;
    const result = await pool.query(
      'UPDATE floors SET floor_name = $1, block_id = $2 WHERE id = $3 RETURNING *',
      [floor_name, block_id, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Floor not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteFloor = async (req, res) => {
  try {
    await pool.query('DELETE FROM floors WHERE id = $1', [req.params.id]);
    res.json({ message: 'Floor deleted' });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({ message: 'Cannot delete this floor — it is still linked to other records.' });
    }
    console.error('Delete floor error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DEPARTMENTS
const getDepartments = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM departments ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const addDepartment = async (req, res) => {
  try {
    const { department_name } = req.body;
    const result = await pool.query(
      'INSERT INTO departments (department_name) VALUES ($1) RETURNING *',
      [department_name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const { department_name } = req.body;
    const result = await pool.query(
      'UPDATE departments SET department_name = $1 WHERE id = $2 RETURNING *',
      [department_name, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Department not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    await pool.query('DELETE FROM departments WHERE id = $1', [req.params.id]);
    res.json({ message: 'Department deleted' });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({ message: 'Cannot delete this department — it is still referenced by other records (e.g. employees or complaints).' });
    }
    console.error('Delete department error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ISSUE CATEGORIES
const getCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM issue_categories ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const addCategory = async (req, res) => {
  try {
    const { category_name } = req.body;
    const result = await pool.query(
      'INSERT INTO issue_categories (category_name) VALUES ($1) RETURNING *',
      [category_name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { category_name } = req.body;
    const result = await pool.query(
      'UPDATE issue_categories SET category_name = $1 WHERE id = $2 RETURNING *',
      [category_name, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Category not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    await pool.query('DELETE FROM issue_categories WHERE id = $1', [req.params.id]);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({ message: 'Cannot delete this category — it is still referenced by existing complaints.' });
    }
    console.error('Delete category error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DESIGNATIONS (Employee job titles/roles, e.g. Electrician, Plumber, Security Guard)
const getDesignations = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM designations ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const addDesignation = async (req, res) => {
  try {
    const { designation_name } = req.body;
    const result = await pool.query(
      'INSERT INTO designations (designation_name) VALUES ($1) RETURNING *',
      [designation_name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'This designation already exists.' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateDesignation = async (req, res) => {
  try {
    const { designation_name } = req.body;
    const result = await pool.query(
      'UPDATE designations SET designation_name = $1 WHERE id = $2 RETURNING *',
      [designation_name, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Designation not found' });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'This designation already exists.' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteDesignation = async (req, res) => {
  try {
    await pool.query('DELETE FROM designations WHERE id = $1', [req.params.id]);
    res.json({ message: 'Designation deleted' });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({ message: 'Cannot delete this designation — it is still assigned to one or more employees.' });
    }
    console.error('Delete designation error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  getBuildings, addBuilding, updateBuilding, deleteBuilding,
  getBlocks, addBlock, updateBlock, deleteBlock,
  getFloors, addFloor, updateFloor, deleteFloor,
  getDepartments, addDepartment, updateDepartment, deleteDepartment,
  getCategories, addCategory, updateCategory, deleteCategory,
  getDesignations, addDesignation, updateDesignation, deleteDesignation
};