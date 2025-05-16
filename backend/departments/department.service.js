const db = require("_helpers/db");

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: _delete,
};

async function getAll() {
  // Get all departments and include the employee count
  const departments = await db.Department.findAll({
    attributes: {
      include: [
        [
          db.sequelize.literal(
            "(SELECT COUNT(*) FROM employees WHERE employees.departmentId = department.id)"
          ),
          "employeeCount",
        ],
      ],
    },
  });
  return departments;
}

async function getById(id) {
  const department = await getDepartment(id);

  // Get the employee count for this department
  const employeeCount = await db.Employee.count({
    where: { departmentId: id },
  });

  // Add the employee count to the department object
  const departmentData = department.get();
  departmentData.employeeCount = employeeCount;

  return departmentData;
}

async function create(params) {
  // Validate if department with same name exists
  if (await db.Department.findOne({ where: { name: params.name } })) {
    throw 'Department with name "' + params.name + '" already exists';
  }

  // Create and save the department
  const department = new db.Department(params);
  department.employeeCount = 0; // Start with zero employees

  await department.save();

  return department;
}

async function update(id, params) {
  const department = await getDepartment(id);

  // Validate if department name already exists (if name is being changed)
  if (
    params.name &&
    params.name !== department.name &&
    (await db.Department.findOne({ where: { name: params.name } }))
  ) {
    throw 'Department with name "' + params.name + '" already exists';
  }

  // Update department
  Object.assign(department, params);
  department.updated = Date.now();

  await department.save();

  return department;
}

async function _delete(id) {
  // Check if department has employees
  const employeeCount = await db.Employee.count({
    where: { departmentId: id },
  });

  if (employeeCount > 0) {
    throw "Cannot delete department that has employees";
  }

  const department = await getDepartment(id);
  await department.destroy();
}

// Helper function to get department by id
async function getDepartment(id) {
  const department = await db.Department.findByPk(id);
  if (!department) throw "Department not found";
  return department;
}
