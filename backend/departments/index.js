const express = require('express');
const router = express.Router();
const db = require('../_helpers/db');
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');

// Routes
router.post('/', authorize(Role.Admin), create);
router.get('/', authorize(), getAll);
router.get('/:id', authorize(), getById);
router.put('/:id', authorize(Role.Admin), update);
router.delete('/:id', authorize(Role.Admin), _delete);

module.exports = router;

// Controller functions
async function create(req, res, next) {
    try {
        // Validate request
        if (!req.body.name) {
            return res.status(400).json({ message: 'Department name is required' });
        }

        // Create department
        const department = await db.Department.create({
            name: req.body.name,
            description: req.body.description
        });

        return res.status(201).json(department);
    } catch (err) {
        next(err);
    }
}

async function getAll(req, res, next) {
    try {
        const departments = await db.Department.findAll({
            include: [{ model: db.Employee, attributes: ['id'] }]
        });
        
        // Map and count employees per department
        const result = departments.map(d => ({
            ...d.toJSON(),
            employeeCount: d.Employees ? d.Employees.length : 0
        }));
        
        return res.json(result);
    } catch (err) {
        next(err);
    }
}

async function getById(req, res, next) {
    try {
        const department = await getDepartmentById(req.params.id);
        
        // Count employees in this department
        const employees = await db.Employee.findAll({
            where: { departmentId: department.id }
        });
        
        const result = {
            ...department.toJSON(),
            employeeCount: employees.length
        };
        
        return res.json(result);
    } catch (err) {
        next(err);
    }
}

async function update(req, res, next) {
    try {
        const department = await getDepartmentById(req.params.id);
        
        // Validate
        if (!req.body.name) {
            return res.status(400).json({ message: 'Department name is required' });
        }
        
        // Update department fields
        const updates = {
            name: req.body.name,
            description: req.body.description,
            updated: new Date()
        };
        
        // Save changes
        Object.assign(department, updates);
        await department.save();
        
        return res.json(department);
    } catch (err) {
        next(err);
    }
}

async function _delete(req, res, next) {
    try {
        const department = await getDepartmentById(req.params.id);
        
        // Check if department has employees
        const employees = await db.Employee.findAll({
            where: { departmentId: department.id }
        });
        
        if (employees.length > 0) {
            return res.status(400).json({ 
                message: 'Cannot delete department with assigned employees. Transfer employees first.' 
            });
        }
        
        await department.destroy();
        return res.json({ message: 'Department deleted successfully' });
    } catch (err) {
        next(err);
    }
}

// Helper function to get department by ID
async function getDepartmentById(id) {
    const department = await db.Department.findByPk(id);
    if (!department) {
        throw { name: 'NotFound', message: 'Department not found' };
    }
    return department;
}