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
router.post('/:id/transfer', authorize(Role.Admin), transfer);

module.exports = router;

// Controller functions
async function create(req, res, next) {
    try {
        // Validate required fields
        if (!req.body.employeeId || !req.body.userId || !req.body.position || 
            !req.body.hireDate || !req.body.departmentId) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Validate department exists
        const department = await db.Department.findByPk(req.body.departmentId);
        if (!department) {
            return res.status(400).json({ 
                message: `Department not found with ID: ${req.body.departmentId}. Please create the department first.`
            });
        }

        // Validate user exists
        const user = await db.Account.findByPk(req.body.userId);
        if (!user) {
            return res.status(400).json({ message: `User not found with ID: ${req.body.userId}` });
        }

        // Check if employee ID already exists
        const existingEmployee = await db.Employee.findOne({ 
            where: { employeeId: req.body.employeeId } 
        });
        if (existingEmployee) {
            return res.status(400).json({ message: 'Employee ID already exists' });
        }

        // Create employee
        const employee = await db.Employee.create({
            employeeId: req.body.employeeId,
            userId: req.body.userId,
            position: req.body.position,
            hireDate: req.body.hireDate,
            departmentId: req.body.departmentId
        });

        return res.status(201).json(employee);
    } catch (err) {
        next(err);
    }
}

async function getAll(req, res, next) {
    try {
        const employees = await db.Employee.findAll({
            include: [
                { model: db.Account, attributes: ['firstName', 'lastName', 'email'] },
                { model: db.Department, attributes: ['name'] }
            ]
        });
        return res.json(employees);
    } catch (err) {
        next(err);
    }
}

async function getById(req, res, next) {
    try {
        const employee = await getEmployeeById(req.params.id);
        return res.json(employee);
    } catch (err) {
        next(err);
    }
}

async function update(req, res, next) {
    try {
        const employee = await getEmployeeById(req.params.id);
        
        // Validate department if provided
        if (req.body.departmentId) {
            const department = await db.Department.findByPk(req.body.departmentId);
            if (!department) {
                return res.status(400).json({ message: 'Department not found' });
            }
        }
        
        // Update employee fields
        const updates = {
            position: req.body.position !== undefined ? req.body.position : employee.position,
            hireDate: req.body.hireDate !== undefined ? req.body.hireDate : employee.hireDate,
            departmentId: req.body.departmentId !== undefined ? req.body.departmentId : employee.departmentId,
            updated: new Date()
        };
        
        // Save changes
        Object.assign(employee, updates);
        await employee.save();
        
        return res.json(employee);
    } catch (err) {
        next(err);
    }
}

async function _delete(req, res, next) {
    try {
        const employee = await getEmployeeById(req.params.id);
        
        // Check for active workflows or requests for this employee
        const workflows = await db.Workflow.findAll({ where: { employeeId: employee.id } });
        if (workflows.length > 0) {
            return res.status(400).json({ 
                message: 'Cannot delete employee with active workflows' 
            });
        }
        
        await employee.destroy();
        return res.json({ message: 'Employee deleted successfully' });
    } catch (err) {
        next(err);
    }
}

async function transfer(req, res, next) {
    try {
        const employee = await getEmployeeById(req.params.id);
        
        // Validate department exists
        if (!req.body.departmentId) {
            return res.status(400).json({ message: 'Department ID is required' });
        }
        
        const department = await db.Department.findByPk(req.body.departmentId);
        if (!department) {
            return res.status(400).json({ message: 'Department not found' });
        }
        
        // Save previous department for workflow record
        const previousDepartmentId = employee.departmentId;
        
        // Update employee department
        employee.departmentId = req.body.departmentId;
        employee.updated = new Date();
        await employee.save();
        
        // Create workflow record for transfer
        await db.Workflow.create({
            employeeId: employee.id,
            type: 'Transfer',
            details: { 
                previousDepartmentId: previousDepartmentId,
                newDepartmentId: req.body.departmentId
            }
        });
        
        return res.json({ 
            message: 'Employee transferred successfully',
            employee: employee
        });
    } catch (err) {
        next(err);
    }
}

// Helper function to get employee by ID
async function getEmployeeById(id) {
    const employee = await db.Employee.findByPk(id, {
        include: [
            { model: db.Account, attributes: ['firstName', 'lastName', 'email'] },
            { model: db.Department, attributes: ['name'] }
        ]
    });
    
    if (!employee) {
        throw { name: 'NotFound', message: 'Employee not found' };
    }
    
    return employee;
}