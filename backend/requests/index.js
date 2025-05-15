const express = require('express');
const router = express.Router();
const db = require('../_helpers/db');
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const { createSchema, updateSchema } = require('./requests.validator');

router.post('/', authorize(), createSchema, create);
router.get('/', authorize(Role.Admin), getAll);
router.get('/:id', authorize(), getById);
router.get('/employee/:employeeId', authorize(), getByEmployeeId);
router.put('/:id', authorize(Role.Admin), updateSchema, update);
router.delete('/:id', authorize(Role.Admin), _delete);

async function create(req, res, next) {
    try {
        // Create the request
        const request = await db.Request.create({
            employeeId: req.body.employeeId,
            type: req.body.type,
            status: 'Pending',
            created: Date.now(),
            updated: Date.now()
        });
        
        // Create the request items
        if (req.body.items && req.body.items.length > 0) {
            await db.RequestItem.bulkCreate(req.body.items.map(item => ({
                requestId: request.id,
                name: item.name,
                quantity: item.quantity
            })));
        }
        
        // Fetch the created request with its items
        const createdRequest = await db.Request.findByPk(request.id, {
            include: [{ model: db.RequestItem }]
        });
        
        res.status(201).json(createdRequest);
    } catch (err) {
        next(err);
    }
}

async function getAll(req, res, next) {
    try {
        const requests = await db.Request.findAll({
            include: [{ model: db.RequestItem }]
        });
        res.json(requests);
    } catch (err) {
        next(err);
    }
}

async function getById(req, res, next) {
    try {
        const request = await db.Request.findByPk(req.params.id, {
            include: [{ model: db.RequestItem }]
        });
        if (!request) throw 'Request not found';
        
        // Only admins or the employee who created the request can view it
        if (req.user.role !== Role.Admin && request.employeeId !== req.user.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        
        res.json(request);
    } catch (err) {
        next(err);
    }
}

async function getByEmployeeId(req, res, next) {
    try {
        const requests = await db.Request.findAll({
            where: { employeeId: req.params.employeeId },
            include: [{ model: db.RequestItem }]
        });
        
        // Only admins or the employee themselves can view their requests
        if (req.user.role !== Role.Admin && parseInt(req.params.employeeId) !== req.user.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        
        res.json(requests);
    } catch (err) {
        next(err);
    }
}

async function update(req, res, next) {
    try {
        const request = await db.Request.findByPk(req.params.id);
        if (!request) throw 'Request not found';
        
        // Update request fields
        if (req.body.type) request.type = req.body.type;
        if (req.body.status) request.status = req.body.status;
        request.updated = Date.now();
        await request.save();
        
        // Update items if provided
        if (req.body.items) {
            // Delete existing items
            await db.RequestItem.destroy({ where: { requestId: request.id } });
            
            // Create new items
            if (req.body.items.length > 0) {
                await db.RequestItem.bulkCreate(req.body.items.map(item => ({
                    requestId: request.id,
                    name: item.name,
                    quantity: item.quantity
                })));
            }
        }
        
        // Fetch updated request with items
        const updatedRequest = await db.Request.findByPk(request.id, {
            include: [{ model: db.RequestItem }]
        });
        
        res.json(updatedRequest);
    } catch (err) {
        next(err);
    }
}

async function _delete(req, res, next) {
    try {
        const request = await db.Request.findByPk(req.params.id);
        if (!request) throw 'Request not found';
        
        // Delete the request (cascade should handle items)
        await request.destroy();
        
        res.json({ message: 'Request deleted successfully' });
    } catch (err) {
        next(err);
    }
}

module.exports = router;