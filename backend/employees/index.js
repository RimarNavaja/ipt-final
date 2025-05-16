const express = require("express");
const router = express.Router();
const employeeService = require("./employee.service");
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
router.post("/:id/transfer", authorize(Role.Admin), transferSchema, transfer);

module.exports = router;

// Route handler functions
function getAll(req, res, next) {
  employeeService
    .getAll()
    .then((employees) => res.json(employees))
    .catch(next);
}

function getById(req, res, next) {
  employeeService
    .getById(parseInt(req.params.id))
    .then((employee) => res.json(employee))
    .catch(next);
}

function create(req, res, next) {
  employeeService
    .create(req.body)
    .then((employee) => res.json(employee))
    .catch(next);
}

function update(req, res, next) {
  employeeService
    .update(parseInt(req.params.id), req.body)
    .then((employee) => res.json(employee))
    .catch(next);
}

function _delete(req, res, next) {
  employeeService
    .delete(parseInt(req.params.id))
    .then(() => res.json({ message: "Employee deleted successfully" }))
    .catch(next);
}

function transfer(req, res, next) {
  employeeService
    .transfer(parseInt(req.params.id), req.body)
    .then((result) => res.json(result))
    .catch(next);
}

// Schema validation functions
function createSchema(req, res, next) {
  const schema = Joi.object({
    employeeId: Joi.string().required(),
    userId: Joi.number().required(),
    departmentId: Joi.number().required(),
    position: Joi.string().required(),
    hireDate: Joi.date().required(),
    status: Joi.string().valid("Active", "Inactive").default("Active"),
  });
  validateRequest(req, next, schema);
}

function updateSchema(req, res, next) {
  const schema = Joi.object({
    employeeId: Joi.string().empty(""),
    userId: Joi.number().empty(""),
    departmentId: Joi.number().empty(""),
    position: Joi.string().empty(""),
    hireDate: Joi.date().empty(""),
    status: Joi.string().valid("Active", "Inactive").empty(""),
  });
  validateRequest(req, next, schema);
}

function transferSchema(req, res, next) {
  const schema = Joi.object({
    departmentId: Joi.number(),
    newDepartment: Joi.string(),
  }).or("departmentId", "newDepartment");

  validateRequest(req, next, schema);
}
