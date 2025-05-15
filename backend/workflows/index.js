const express = require('express');
const router = express.Router();
const db = require('../_helpers/db');
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const { createSchema, updateStatusSchema, onboardingSchema } = require('./workflows.validator');

router.post('/', authorize(Role.Admin), createSchema, create);
router.get('/employee/:employeeId', authorize(), getByEmployeeId);
router.put('/:id/status', authorize(Role.Admin), updateStatusSchema, updateStatus);
router.post('/onboarding', authorize(Role.Admin), onboardingSchema, onboarding);

async function create(req, res, next) {
    try {
        const workflow = await db.Workflow.create(req.body);
        res.status(201).json(workflow);
    } catch (err) {
        next(err);
    }
}

async function getByEmployeeId(req, res, next) {
    try {
        const workflows = await db.Workflow.findAll({
            where: { employeeId: req.params.employeeId }
        });
        res.json(workflows);
    } catch (err) {
        next(err);
    }
}

async function updateStatus(req, res, next) {
    try {
        const workflow = await db.Workflow.findByPk(req.params.id);
        if (!workflow) throw 'Workflow not found';
        workflow.status = req.body.status;
        workflow.updated = Date.now();
        await workflow.save();
        res.json(workflow);
    } catch (err) {
        next(err);
    }
}

async function onboarding(req, res, next) {
    try {
        const workflow = await db.Workflow.create({
            employeeId: req.body.employeeId,
            type: 'Onboarding',
            details: req.body.details,
            status: 'Pending',
            created: Date.now(),
            updated: Date.now()
        });
        res.status(201).json(workflow);
    } catch (err) {
        next(err);
    }
}

module.exports = router;