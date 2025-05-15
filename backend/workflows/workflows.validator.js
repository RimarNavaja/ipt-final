const Joi = require('joi');
const validateRequest = require('../_middleware/validate-request');

module.exports = {
    createSchema,
    updateStatusSchema,
    onboardingSchema
};

function createSchema(req, res, next) {
    const schema = Joi.object({
        employeeId: Joi.number().required(),
        type: Joi.string().required(),
        details: Joi.object().required(),
        status: Joi.string()
    });
    validateRequest(req, next, schema);
}

function updateStatusSchema(req, res, next) {
    const schema = Joi.object({
        status: Joi.string().required().valid('Pending', 'In Progress', 'Completed', 'Cancelled')
    });
    validateRequest(req, next, schema);
}

function onboardingSchema(req, res, next) {
    const schema = Joi.object({
        employeeId: Joi.number().required(),
        details: Joi.object().required()
    });
    validateRequest(req, next, schema);
} 