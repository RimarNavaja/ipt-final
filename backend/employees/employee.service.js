const db = require("_helpers/db");

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: _delete,
  transfer,
};

async function getAll() {
  const employees = await db.Employee.findAll({
    include: [
      { model: db.Department, attributes: ["name"] },
      { model: db.Account, attributes: ["firstName", "lastName", "email"] },
    ],
  });

  // Format results to include department and account details
  return employees.map((employee) => {
    const employeeData = employee.get();

    if (employee.department) {
      employeeData.departmentName = employee.department.name;
    }

    if (employee.account) {
      employeeData.accountName = `${employee.account.firstName} ${employee.account.lastName}`;
      employeeData.accountEmail = employee.account.email;
    }

    return employeeData;
  });
}

async function getById(id) {
  const employee = await getEmployee(id);

  // Get department and account details
  const department = await db.Department.findByPk(employee.departmentId);
  const account = await db.Account.findByPk(employee.userId);

  // Format results
  const employeeData = employee.get();

  if (department) {
    employeeData.departmentName = department.name;
  }

  if (account) {
    employeeData.accountName = `${account.firstName} ${account.lastName}`;
    employeeData.accountEmail = account.email;
  }

  return employeeData;
}

async function create(params) {
  // Validate employee ID
  if (await db.Employee.findOne({ where: { employeeId: params.employeeId } })) {
    throw 'Employee ID "' + params.employeeId + '" is already taken';
  }

  // Validate user ID
  if (await db.Employee.findOne({ where: { userId: params.userId } })) {
    throw "Account is already associated with an employee";
  }

  // Validate department exists
  const department = await db.Department.findByPk(params.departmentId);
  if (!department) {
    throw "Department not found";
  }

  // Create employee
  const employee = new db.Employee(params);
  employee.status = employee.status || "Active";

  await employee.save();

  // Return employee with department name
  const employeeData = employee.get();
  employeeData.departmentName = department.name;

  return employeeData;
}

async function update(id, params) {
  const employee = await getEmployee(id);

  // Validate employee ID if changing
  if (
    params.employeeId &&
    params.employeeId !== employee.employeeId &&
    (await db.Employee.findOne({ where: { employeeId: params.employeeId } }))
  ) {
    throw 'Employee ID "' + params.employeeId + '" is already taken';
  }

  // Validate user ID if changing
  if (
    params.userId &&
    params.userId !== employee.userId &&
    (await db.Employee.findOne({ where: { userId: params.userId } }))
  ) {
    throw "Account is already associated with an employee";
  }

  // Validate department exists if changing
  if (params.departmentId && params.departmentId !== employee.departmentId) {
    const department = await db.Department.findByPk(params.departmentId);
    if (!department) {
      throw "Department not found";
    }
  }

  // Update employee
  Object.assign(employee, params);
  employee.updated = Date.now();

  await employee.save();

  return employee;
}

async function _delete(id) {
  const employee = await getEmployee(id);

  // Check if employee has workflows
  const workflowCount = await db.Workflow.count({ where: { employeeId: id } });
  if (workflowCount > 0) {
    throw "Cannot delete employee who has workflows";
  }

  // Check if employee has requests
  const requestCount = await db.Request.count({ where: { employeeId: id } });
  if (requestCount > 0) {
    throw "Cannot delete employee who has requests";
  }

  await employee.destroy();
}

async function transfer(id, params) {
  const employee = await getEmployee(id);

  // Find the department - support both departmentId and newDepartment parameters
  let department;

  if (params.departmentId) {
    // If departmentId is provided, use it (priority)
    department = await db.Department.findByPk(params.departmentId);
  } else if (params.newDepartment) {
    // Fallback to finding by name
    department = await db.Department.findOne({
      where: { name: params.newDepartment },
    });
  }

  if (!department) {
    throw "Department not found";
  }

  // Get the current department
  const currentDepartment = await db.Department.findByPk(employee.departmentId);

  // Instead of transferring directly, create a workflow for approval
  const workflow = new db.Workflow({
    employeeId: id,
    type: "Department Transfer",
    details: {
      previousDepartment: currentDepartment ? currentDepartment.name : "None",
      newDepartment: department.name,
      newDepartmentId: department.id, // Store department ID for easier processing later
    },
    status: "Pending",
  });

  await workflow.save();

  return {
    message: "Transfer request created",
    workflow: workflow,
  };
}

// Helper function to get employee by id
async function getEmployee(id) {
  const employee = await db.Employee.findByPk(id);
  if (!employee) throw "Employee not found";
  return employee;
}
