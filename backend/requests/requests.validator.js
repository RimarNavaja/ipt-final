const Joi = require('joi');
const validateRequest = require('../_middleware/validate-request');

module.exports = {
    createSchema,
    updateSchema
};

function createSchema(req, res, next) {
    const schema = Joi.object({
        employeeId: Joi.number().required(),
        type: Joi.string().required(),
        items: Joi.array().items(
            Joi.object({
                name: Joi.string().required(),
                quantity: Joi.number().integer().required()
            })
        ).required(),
        status: Joi.string()
    });
    validateRequest(req, next, schema);
}

function updateSchema(req, res, next) {
    const schema = Joi.object({
        type: Joi.string(),
        status: Joi.string(),
        items: Joi.array().items(
            Joi.object({
                name: Joi.string().required(),
                quantity: Joi.number().integer().required()
            })
        )
    });
    validateRequest(req, next, schema);
} 