const db = require("_helpers/db");

module.exports = {
  getByEmployeeId,
  create,
  update,
  updateStatus,
};

async function getByEmployeeId(employeeId) {
  // Verify employee exists
  const employee = await db.Employee.findByPk(employeeId);
  if (!employee) throw "Employee not found";

  // Get all workflows for this employee
  const workflows = await db.Workflow.findAll({
    where: { employeeId: employeeId },
  });

  return workflows;
}

async function create(params) {
  // Validate employee exists
  const employee = await db.Employee.findByPk(params.employeeId);
  if (!employee) throw "Employee not found";

  // Create workflow
  const workflow = new db.Workflow(params);
  workflow.status = workflow.status || "Pending";

  await workflow.save();

  return workflow;
}

async function update(id, params) {
  const workflow = await getWorkflow(id);

  // Update workflow
  Object.assign(workflow, params);
  workflow.updated = Date.now();

  // Handle status change for approved/rejected workflows
  if (
    params.status &&
    (params.status === "Approved" || params.status === "Rejected")
  ) {
    await handleWorkflowStatusChange(workflow, params.status);
  }

  await workflow.save();

  return workflow;
}

async function updateStatus(id, params) {
  const workflow = await getWorkflow(id);

  // Update status
  workflow.status = params.status;
  workflow.updated = Date.now();

  // Handle status change for approved/rejected workflows
  if (params.status === "Approved" || params.status === "Rejected") {
    await handleWorkflowStatusChange(workflow, params.status);
  }

  await workflow.save();

  return workflow;
}

// Helper functions

async function handleWorkflowStatusChange(workflow, newStatus) {
  // Handle Request Approval workflows
  if (
    workflow.type === "Request Approval" &&
    workflow.details &&
    workflow.details.requestId
  ) {
    const requestId = workflow.details.requestId;
    const request = await db.Request.findByPk(requestId);

    if (request) {
      // Update request status
      request.status = newStatus;
      request.updated = Date.now();
      await request.save();
    }
  }

  // Handle Department Transfer workflows
  if (
    workflow.type === "Department Transfer" &&
    newStatus === "Approved" &&
    workflow.details
  ) {
    const employee = await db.Employee.findByPk(workflow.employeeId);
    if (employee) {
      let departmentId = null;

      // First try to use the department ID if available
      if (workflow.details.newDepartmentId) {
        departmentId = workflow.details.newDepartmentId;
      }
      // Otherwise look up by name
      else if (workflow.details.newDepartment) {
        const newDepartment = await db.Department.findOne({
          where: { name: workflow.details.newDepartment },
        });
        if (newDepartment) {
          departmentId = newDepartment.id;
        }
      }

      if (departmentId) {
        // Update employee's department
        employee.departmentId = departmentId;
        employee.updated = Date.now();
        await employee.save();
      }
    }
  }
}

async function getWorkflow(id) {
  const workflow = await db.Workflow.findByPk(id);
  if (!workflow) throw "Workflow not found";
  return workflow;
}
