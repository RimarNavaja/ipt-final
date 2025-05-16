const db = require("_helpers/db");
const { Op } = require("sequelize");

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: _delete,
};

async function getAll(accountId, role) {
  let requests;

  // If admin, return all requests
  if (role === "Admin") {
    requests = await db.Request.findAll({
      include: [
        { model: db.RequestItem },
        { model: db.Employee, attributes: ["employeeId", "userId"] },
      ],
    });
  } else {
    // For regular users, only return their own requests
    const employee = await db.Employee.findOne({
      where: { userId: accountId },
    });

    if (!employee) return [];

    requests = await db.Request.findAll({
      where: { employeeId: employee.id },
      include: { model: db.RequestItem },
    });
  }

  return requests;
}

async function getById(id) {
  const request = await getRequest(id);

  // Get request items
  const items = await db.RequestItem.findAll({
    where: { requestId: id },
  });

  // Format response
  const requestData = request.get();
  requestData.requestItems = items;

  return requestData;
}

async function create(params, accountId, role) {
  // Validate employee exists if employeeId is provided
  let employeeId = params.employeeId;

  if (!employeeId && role !== "Admin") {
    // If no employeeId and not admin, use the current user's employee record
    const employee = await db.Employee.findOne({
      where: { userId: accountId },
    });
    if (!employee) throw "Employee not found for current user";
    employeeId = employee.id;
  }

  if (employeeId) {
    const employee = await db.Employee.findByPk(employeeId);
    if (!employee) throw "Employee not found";
  }

  // Create request
  const request = new db.Request({
    employeeId: employeeId,
    type: params.type,
    status: "Pending",
  });

  await request.save();

  // Create request items
  if (params.requestItems && Array.isArray(params.requestItems)) {
    for (const item of params.requestItems) {
      await db.RequestItem.create({
        requestId: request.id,
        name: item.name,
        quantity: item.quantity || 1,
      });
    }
  }

  // Get account details for workflow
  const account = await db.Account.findByPk(accountId);

  // Create workflow for request approval
  if (employeeId) {
    await db.Workflow.create({
      employeeId: employeeId,
      type: "Request Approval",
      details: {
        requestId: request.id,
        requestType: params.type,
        requestItems: params.requestItems,
        createdBy: `${account.firstName} ${account.lastName}`,
        createdAt: new Date().toISOString(),
      },
      status: "Pending",
    });
  }

  // Return request with items
  return getById(request.id);
}

async function update(id, params, accountId) {
  const request = await getRequest(id);

  // Validate employee if changing
  if (params.employeeId && params.employeeId !== request.employeeId) {
    const employee = await db.Employee.findByPk(params.employeeId);
    if (!employee) throw "Employee not found";
  }

  // Update request
  Object.assign(request, {
    employeeId: params.employeeId || request.employeeId,
    type: params.type || request.type,
    status: params.status || request.status,
    updated: Date.now(),
  });

  await request.save();

  // Update request items if provided
  if (params.requestItems && Array.isArray(params.requestItems)) {
    // Delete existing items
    await db.RequestItem.destroy({ where: { requestId: id } });

    // Create new items
    for (const item of params.requestItems) {
      await db.RequestItem.create({
        requestId: request.id,
        name: item.name,
        quantity: item.quantity || 1,
      });
    }
  }

  // Update or create workflow
  const account = await db.Account.findByPk(accountId);
  const workflow = await db.Workflow.findOne({
    where: {
      type: "Request Approval",
      status: "Pending",
      [Op.and]: [
        db.sequelize.literal(`JSON_EXTRACT(details, '$.requestId') = ${id}`),
      ],
    },
  });

  if (workflow) {
    // Update existing workflow
    workflow.details = {
      ...workflow.details,
      requestType: params.type || request.type,
      requestItems: params.requestItems || workflow.details.requestItems,
      updatedBy: `${account.firstName} ${account.lastName}`,
      updatedAt: new Date().toISOString(),
    };

    // If request status was updated, reflect in workflow
    if (params.status && params.status !== "Pending") {
      workflow.status = params.status;
    }

    await workflow.save();
  } else if (request.employeeId) {
    // Create new workflow if none exists
    await db.Workflow.create({
      employeeId: request.employeeId,
      type: "Request Approval",
      details: {
        requestId: request.id,
        requestType: request.type,
        requestItems: params.requestItems,
        createdBy: `${account.firstName} ${account.lastName}`,
        createdAt: new Date().toISOString(),
      },
      status: "Pending",
    });
  }

  // Return updated request with items
  return getById(request.id);
}

async function _delete(id) {
  const request = await getRequest(id);

  // Delete related items
  await db.RequestItem.destroy({ where: { requestId: id } });

  // Delete related workflows
  await db.Workflow.destroy({
    where: {
      type: "Request Approval",
      [Op.and]: [
        db.sequelize.literal(`JSON_EXTRACT(details, '$.requestId') = ${id}`),
      ],
    },
  });

  // Delete request
  await request.destroy();
}

// Helper function to get request
async function getRequest(id) {
  const request = await db.Request.findByPk(id);
  if (!request) throw "Request not found";
  return request;
}
