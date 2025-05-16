const express = require("express");
const router = express.Router();
const departmentService = require("./department.service");
const authorize = require("_middleware/authorize");
const Role = require("_helpers/role");
const validateRequest = require("_middleware/validate-request");
const Joi = require("joi");

// Routes
router.get("/", authorize(), getAll);
router.get("/:id", authorize(), getById);
router.post("/", authorize(Role.Admin), createSchema, create);
router.put("/:id", authorize(Role.Admin), updateSchema, update);
router.delete("/:id", authorize(Role.Admin), _delete);

module.exports = router;

// Route handler functions
function getAll(req, res, next) {
  departmentService
    .getAll()
    .then((departments) => res.json(departments))
    .catch(next);
}

function getById(req, res, next) {
  departmentService
    .getById(parseInt(req.params.id))
    .then((department) => res.json(department))
    .catch(next);
}

function create(req, res, next) {
  departmentService
    .create(req.body)
    .then((department) => res.json(department))
    .catch(next);
}

function update(req, res, next) {
  departmentService
    .update(parseInt(req.params.id), req.body)
    .then((department) => res.json(department))
    .catch(next);
}

function _delete(req, res, next) {
  departmentService
    .delete(parseInt(req.params.id))
    .then(() => res.json({ message: "Department deleted successfully" }))
    .catch(next);
}

// Schema validation functions
function createSchema(req, res, next) {
  const schema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow("", null),
  });
  validateRequest(req, next, schema);
}

function updateSchema(req, res, next) {
  const schema = Joi.object({
    name: Joi.string().empty(""),
    description: Joi.string().allow("", null),
  });
  validateRequest(req, next, schema);
}
