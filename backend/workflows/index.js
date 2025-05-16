const express = require("express");
const router = express.Router();
const workflowService = require("./workflow.service");
const authorize = require("_middleware/authorize");
const Role = require("_helpers/role");
const validateRequest = require("_middleware/validate-request");
const Joi = require("joi");

// Routes
router.get("/employee/:id", authorize(), getByEmployeeId);
router.post("/", authorize(Role.Admin), createSchema, create);
router.put("/:id", authorize(Role.Admin), updateSchema, update);
router.put("/:id/status", authorize(Role.Admin), statusSchema, updateStatus);

module.exports = router;

// Route handler functions
function getByEmployeeId(req, res, next) {
  workflowService
    .getByEmployeeId(parseInt(req.params.id))
    .then((workflows) => res.json(workflows))
    .catch(next);
}

function create(req, res, next) {
  workflowService
    .create(req.body)
    .then((workflow) => res.json(workflow))
    .catch(next);
}

function update(req, res, next) {
  workflowService
    .update(parseInt(req.params.id), req.body)
    .then((workflow) => res.json(workflow))
    .catch(next);
}

function updateStatus(req, res, next) {
  workflowService
    .updateStatus(parseInt(req.params.id), req.body)
    .then((workflow) => res.json(workflow))
    .catch(next);
}

// Schema validation functions
function createSchema(req, res, next) {
  const schema = Joi.object({
    employeeId: Joi.number().required(),
    type: Joi.string().required(),
    details: Joi.object().allow(null),
    status: Joi.string()
      .valid("Pending", "Approved", "Rejected")
      .default("Pending"),
  });
  validateRequest(req, next, schema);
}

function updateSchema(req, res, next) {
  const schema = Joi.object({
    employeeId: Joi.number().empty(""),
    type: Joi.string().empty(""),
    details: Joi.object().allow(null),
    status: Joi.string().valid("Pending", "Approved", "Rejected").empty(""),
  });
  validateRequest(req, next, schema);
}

function statusSchema(req, res, next) {
  const schema = Joi.object({
    status: Joi.string().valid("Pending", "Approved", "Rejected").required(),
  });
  validateRequest(req, next, schema);
}
