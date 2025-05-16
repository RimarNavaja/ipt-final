const express = require("express");
const router = express.Router();
const requestService = require("./request.service");
const authorize = require("_middleware/authorize");
const Role = require("_helpers/role");
const validateRequest = require("_middleware/validate-request");
const Joi = require("joi");

// Routes
router.get("/", authorize(), getAll);
router.get("/:id", authorize(), getById);
router.post("/", authorize(), createSchema, create);
router.put("/:id", authorize(Role.Admin), updateSchema, update);
router.delete("/:id", authorize(Role.Admin), _delete);

module.exports = router;

// Route handler functions
function getAll(req, res, next) {
  requestService
    .getAll(req.user.id, req.user.role)
    .then((requests) => res.json(requests))
    .catch(next);
}

function getById(req, res, next) {
  requestService
    .getById(parseInt(req.params.id))
    .then((request) => res.json(request))
    .catch(next);
}

function create(req, res, next) {
  requestService
    .create(req.body, req.user.id, req.user.role)
    .then((request) => res.json(request))
    .catch(next);
}

function update(req, res, next) {
  requestService
    .update(parseInt(req.params.id), req.body, req.user.id)
    .then((request) => res.json(request))
    .catch(next);
}

function _delete(req, res, next) {
  requestService
    .delete(parseInt(req.params.id))
    .then(() => res.json({ message: "Request deleted successfully" }))
    .catch(next);
}

// Schema validation functions
function createSchema(req, res, next) {
  const requestItemSchema = Joi.object({
    name: Joi.string().required(),
    quantity: Joi.number().integer().min(1).default(1),
  });

  const schema = Joi.object({
    employeeId: Joi.number(),
    type: Joi.string().required(),
    requestItems: Joi.array().items(requestItemSchema).required().min(1),
  });

  validateRequest(req, next, schema);
}

function updateSchema(req, res, next) {
  const requestItemSchema = Joi.object({
    name: Joi.string().required(),
    quantity: Joi.number().integer().min(1).default(1),
  });

  const schema = Joi.object({
    employeeId: Joi.number().empty(""),
    type: Joi.string().empty(""),
    status: Joi.string().valid("Pending", "Approved", "Rejected").empty(""),
    requestItems: Joi.array().items(requestItemSchema).min(1),
  });

  validateRequest(req, next, schema);
}
