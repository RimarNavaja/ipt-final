import { Injectable } from "@angular/core";
import {
  HttpRequest,
  HttpResponse,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HTTP_INTERCEPTORS,
  HttpHeaders,
} from "@angular/common/http";
import { Observable, of, throwError } from "rxjs";
import { delay, materialize, dematerialize, mergeMap } from "rxjs/operators";

import { AlertService } from "@app/_services";
import { Role } from "@app/_models";

// array in local storage for accounts
const accountsKey = "angular-18-signup-verification-boilerplate-accounts";
const defaultAccounts = [
  {
    id: 1,
    title: "Mr",
    firstName: "Admin",
    lastName: "User",
    email: "admin@example.com",
    password: "admin",
    role: "Admin",
    isVerified: true,
    refreshTokens: [],
    employeeId: 1,
    isActive: true,
  },
  {
    id: 2,
    title: "Mr",
    firstName: "Normal",
    lastName: "User",
    email: "user@example.com",
    password: "user",
    role: "User",
    isVerified: true,
    refreshTokens: [],
    employeeId: 2,
    isActive: true,
  },
];

// Clear localStorage accounts for testing purposes (remove in production)
localStorage.removeItem(accountsKey);

// Get accounts from localStorage or use defaults
let storedAccounts = JSON.parse(localStorage.getItem(accountsKey)) || [];
// Ensure default accounts always exist
let accounts = storedAccounts;
if (!accounts.some((x) => x.email === "admin@example.com")) {
  accounts.push(defaultAccounts[0]);
}
if (!accounts.some((x) => x.email === "user@example.com")) {
  accounts.push(defaultAccounts[1]);
}
// Update localStorage with the merged accounts
localStorage.setItem(accountsKey, JSON.stringify(accounts));

// arrays for employees, departments, workflows, and requests
const employeesKey = "employees";
const departmentsKey = "departments";
const workflowsKey = "workflows";
const requestsKey = "requests";

// Define default departments first
const defaultDepartments = [
  {
    id: 1,
    name: "Engineering",
    description: "Software development team",
    employeeCount: 0, // Will be calculated based on employees
  },
  {
    id: 2,
    name: "Marketing",
    description: "Marketing team",
    employeeCount: 0, // Will be calculated based on employees
  },
];

// Load or initialize departments
let departments =
  JSON.parse(localStorage.getItem(departmentsKey)) || defaultDepartments;

// Default employees with correct department references
const defaultEmployees = [
  {
    id: 1,
    employeeId: "EMP001",
    userId: 1,
    position: "Developer",
    departmentId: 1, // Engineering
    hireDate: "2025-01-01",
    status: "Active",
  },
  {
    id: 2,
    employeeId: "EMP002",
    userId: 2,
    position: "Designer",
    departmentId: 1, // Engineering -
    hireDate: "2025-02-01",
    status: "Active",
  },
];

// Load or initialize employees
let employees = JSON.parse(localStorage.getItem(employeesKey)) || [];

// Ensure default employees always exist by checking for their employee IDs
if (!employees.some((e) => e.employeeId === "EMP001")) {
  employees.push(defaultEmployees[0]);
}
if (!employees.some((e) => e.employeeId === "EMP002")) {
  employees.push(defaultEmployees[1]);
}

// Save updated employees to localStorage
localStorage.setItem(employeesKey, JSON.stringify(employees));

// Calculate department counts based on employee distribution
function updateDepartmentCounts() {
  // Reset counts
  departments.forEach((dept) => {
    dept.employeeCount = 0;
  });

  // Count employees in each department
  employees.forEach((emp) => {
    if (emp.departmentId) {
      const dept = departments.find((d) => d.id === emp.departmentId);
      if (dept) {
        dept.employeeCount++;
      }
    }
  });

  // Save updated departments
  localStorage.setItem(departmentsKey, JSON.stringify(departments));
}

// Perform initial count update
updateDepartmentCounts();

let workflows = JSON.parse(localStorage.getItem(workflowsKey)) || [
  {
    id: 1,
    employeeId: 1,
    type: "Onboarding",
    details: { task: "Setup workstation" },
    status: "Pending",
  },
];

let requests = JSON.parse(localStorage.getItem(requestsKey)) || [
  {
    id: 1,
    employeeId: 2,
    type: "Equipment",
    requestItems: [{ name: "Laptop", quantity: 1 }],
    status: "Pending",
  },
];

@Injectable()
export class FakeBackendInterceptor implements HttpInterceptor {
  constructor(private alertService: AlertService) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const { url, method, headers, body } = request;
    const alertService = this.alertService;

    // Recalculate department employee counts based on employee data
    recalculateDepartmentCounts();

    return handleRoute();

    // Helper function to recalculate and update department counts
    function recalculateDepartmentCounts() {
      // Reset all department counts to zero
      departments.forEach((dept) => {
        dept.employeeCount = 0;
      });

      // Count employees in each department
      employees.forEach((emp) => {
        if (emp.departmentId) {
          const dept = departments.find((d) => d.id === emp.departmentId);
          if (dept) {
            dept.employeeCount++;
          }
        }
      });

      // Save updated departments to localStorage
      localStorage.setItem(departmentsKey, JSON.stringify(departments));
    }

    function handleRoute() {
      console.log(`Handling route: ${url} (${method})`);
      switch (true) {
        case url.endsWith("/accounts/authenticate") && method === "POST":
          return authenticate();
        case url.endsWith("/accounts/refresh-token") && method === "POST":
          return refreshToken();
        case url.endsWith("/accounts/revoke-token") && method === "POST":
          return revokeToken();
        case url.endsWith("/accounts/register") && method === "POST":
          return register();
        case url.endsWith("/accounts/verify-email") && method === "POST":
          return verifyEmail();
        case url.endsWith("/accounts/forgot-password") && method === "POST":
          return forgotPassword();
        case url.endsWith("/accounts/validate-reset-token") &&
          method === "POST":
          return validateResetToken();
        case url.endsWith("/accounts/reset-password") && method === "POST":
          return resetPassword();
        case url.endsWith("/accounts") && method === "GET":
          return getAccounts();
        case url.endsWith("/accounts/active") && method === "GET":
          return getActiveAccounts();
        case url.match(/\/accounts\/\d+$/) && method === "GET":
          return getAccountById();
        case url.endsWith("/accounts") && method === "POST":
          return createAccount();
        case url.match(/\/accounts\/\d+$/) && method === "PUT":
          return updateAccount();
        case url.match(/\/accounts\/\d+$/) && method === "DELETE":
          return deleteAccount();

        // Employee routes
        case url.endsWith("/employees") && method === "GET":
          return getEmployees();
        case url.endsWith("/employees") && method === "POST":
          return createEmployee();
        case url.match(/\/employees\/\d+$/) && method === "GET":
          return getEmployeeById();
        case url.match(/\/employees\/\d+$/) && method === "PUT":
          return updateEmployee();
        case url.match(/\/employees\/\d+$/) && method === "DELETE":
          return deleteEmployee();
        case url.match(/\/employees\/\d+\/transfer$/) && method === "POST":
          console.log("Matched specific employee transfer route!");
          return transferEmployee();
        case url.includes("/transfer") && method === "POST":
          console.log("Matched generic transfer route!");
          console.log("URL:", url);
          console.log("Method:", method);
          console.log("Body:", body);
          return transferEmployee();

        // Department routes
        case url.endsWith("/departments") && method === "GET":
          return getDepartments();
        case url.endsWith("/departments/names") && method === "GET":
          console.log("Getting department names for dropdown");
          return ok(departments.map((d) => ({ id: d.id, name: d.name })));
        case url.match(/\/departments\/\d+$/) && method === "GET":
          return getDepartmentById();
        case url.endsWith("/departments") && method === "POST":
          return createDepartment();
        case url.match(/\/departments\/\d+$/) && method === "PUT":
          return updateDepartment();
        case url.match(/\/departments\/\d+$/) && method === "DELETE":
          return deleteDepartment();

        // Workflow routes
        case url.match(/\/workflows\/employee\/\d+$/) && method === "GET":
          return getEmployeeWorkflows();
        case url.endsWith("/workflows") && method === "POST":
          return createWorkflow();
        case url.match(/\/workflows\/\d+$/) && method === "PUT":
          return updateWorkflow();
        case url.match(/\/workflows\/\d+\/status$/) && method === "PUT":
          return updateWorkflowStatus();

        // Request routes
        case url.endsWith("/requests") && method === "GET":
          return getRequests();
        case url.endsWith("/requests") && method === "POST":
          return createRequest();
        case url.match(/\/requests\/\d+$/) && method === "PUT":
          return updateRequest();
        case url.match(/\/requests\/\d+$/) && method === "DELETE":
          return deleteRequest();
        case url.match(/\/requests\/\d+$/) && method === "GET":
          return getRequestById();

        default:
          // pass through any requests not handled above
          return next.handle(request);
      }
    }

    //route functions
    function authenticate() {
      const { email, password } = body;
      console.log("Attempting to authenticate:", email);

      const account = accounts.find(
        (x) => x.email === email && x.password === password && x.isVerified
      );

      console.log("Found account:", account);

      if (!account) return error("Email or password is incorrect");

      // Check if account is active
      if (account.isActive === false) {
        return error(
          "Your account is inactive. Please contact an administrator."
        );
      }

      //add refresh token to account
      account.refreshTokens.push(generateRefreshToken());
      localStorage.setItem(accountsKey, JSON.stringify(accounts));

      return ok({
        ...basicDetails(account),
        jwtToken: generateJwtToken(account),
      });
    }

    function refreshToken() {
      const refreshToken = getRefreshToken();

      if (!refreshToken) return unauthorized();
      const account = accounts.find((x) =>
        x.refreshTokens.includes(refreshToken)
      );

      if (!account) return unauthorized();

      //replace old refresh token with a new one and save
      account.refreshTokens = account.refreshTokens.filter(
        (x) => x !== refreshToken
      );
      account.refreshTokens.push(generateRefreshToken());
      localStorage.setItem(accountsKey, JSON.stringify(accounts));

      return ok({
        ...basicDetails(account),
        jwtToken: generateJwtToken(account),
      });
    }

    function revokeToken() {
      if (!isAuthenticated()) return unauthorized();

      const refreshToken = getRefreshToken();
      const account = accounts.find((x) =>
        x.refreshTokens.includes(refreshToken)
      );

      //revoke token and save
      account.refreshTokens = account.refreshTokens.filter(
        (x) => x !== refreshToken
      );
      localStorage.setItem(accountsKey, JSON.stringify(accounts));

      return ok();
    }

    function register() {
      const account = body;

      if (accounts.find((x) => x.email === account.email)) {
        //display email already registered "email" in alert
        setTimeout(() => {
          alertService.info(
            `
              <h4>Email already registered</h4>
              <p>Your email ${account.email} is already registered.</p>
              <p>If you don't know your password please visit the <a href="${location.origin}/account/forgot-password"> forgot password</a> page.</p>
              <div><strong>Note:</strong> The fake backend displayed this "email" so you can test without an api. A real backend wound send a real email.</div>
              `,
            { autoClose: false }
          );
        }, 1000);

        //always return ok() response to prevent email enumeration
      }
      //assign account id and a few other properties then save
      account.id = newAccountId();
      if (account.id === 1) {
        //first registered account is admin
        account.role = Role.Admin;
      } else {
        account.role = Role.User;
      }
      account.dateCreated = new Date().toISOString();
      account.verificationToken = new Date().getTime().toString();
      account.isVerified = false;
      account.refreshTokens = [];
      delete account.confirmPassword;
      accounts.push(account);

      localStorage.setItem(accountsKey, JSON.stringify(accounts));

      //display verification email alert
      setTimeout(() => {
        const verifyUrl = `${location.origin}/account/verify-email?token=${account.verificationToken}`;
        alertService.info(
          `
          <h4>Verification email </h4>
          <p>Thank you for registering. A verification email has been sent to your email address.</p>
          <p>Please click the below link to verify your email address:</p>
          <p><a href="${verifyUrl}">${verifyUrl}</a></p>
          <div><strong>Note:</strong> The fake backend displayed this "email" so you can test without an api. A real backend wound send a real email.</div>
          `,
          { autoClose: false }
        );
      }, 1000);

      return ok();
    }

    function verifyEmail() {
      const { token } = body;
      const account = accounts.find(
        (x) => !!x.verificationToken && x.verificationToken === token
      );

      if (!account) return error("Invalid verification token");

      //set is verified flag to true if token is valid
      account.isVerified = true;
      localStorage.setItem(accountsKey, JSON.stringify(accounts));

      return ok();
    }

    function forgotPassword() {
      const { email } = body;
      const account = accounts.find((x) => x.email === email);

      //always return ok() response to prevent email enumeration
      if (!account) return ok();

      //create reset token that expires after 24 hours
      account.resetToken = new Date().getTime().toString();
      account.resetTokenExpires = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ).toISOString();
      localStorage.setItem(accountsKey, JSON.stringify(accounts));

      //display password reset email in alert
      setTimeout(() => {
        const resetUrl = `${location.origin}/account/reset-password?token=${account.resetToken}`;
        alertService.info(
          `
          <h4>Password reset email</h4>
          <p>Please click the below link to reset your password:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <div><strong>Note:</strong> The fake backend displayed this "email" so you can test without an api. A real backend wound send a real email.</div>
          `,
          { autoClose: false }
        );
      }, 1000);

      return ok();
    }

    function validateResetToken() {
      const { token } = body;
      const account = accounts.find(
        (x) =>
          !!x.resetToken &&
          x.resetToken === token &&
          new Date() < new Date(x.resetTokenExpires)
      );

      if (!account) return error("Invalid token");

      return ok();
    }

    function resetPassword() {
      const { token, password } = body;
      const account = accounts.find(
        (x) =>
          !!x.resetToken &&
          x.resetToken === token &&
          new Date() < new Date(x.resetTokenExpires)
      );

      if (!account) return error("Invalid token");

      //update passsword and remove reset token
      account.password = password;
      account.isVerified = true;
      delete account.resetToken;
      delete account.resetTokenExpires;
      localStorage.setItem(accountsKey, JSON.stringify(accounts));

      return ok();
    }

    function getAccounts() {
      if (!isAuthenticated()) return unauthorized();

      return ok(accounts.map((x) => basicDetails(x)));
    }

    function getActiveAccounts() {
      if (!isAuthenticated()) return unauthorized();

      // Return only active accounts for dropdowns in employee forms
      const activeAccounts = accounts
        .filter((acc) => acc.isActive !== false)
        .map((x) => basicDetails(x));

      return ok(activeAccounts);
    }

    function getAccountById() {
      if (!isAuthenticated()) return unauthorized();

      let account = accounts.find((x) => x.id === idFromUrl());

      //user account can get own profile and admin account can get all profies
      if (account.id !== currentAccount().id && !isAuthorized(Role.Admin)) {
        return unauthorized();
      }

      return ok(basicDetails(account));
    }

    function createAccount() {
      if (!isAuthorized(Role.Admin)) return unauthorized();

      const account = body;
      if (accounts.find((x) => x.email === account.email)) {
        return error(`Email "${account.email}" is already registered`);
      }

      //assign account id and a few other properties then save
      account.id = newAccountId();
      account.dateCreated = new Date().toISOString();
      account.isVerified = false;
      account.refreshTokens = [];

      // Set isActive to true by default if not specified
      account.isActive =
        account.isActive !== undefined ? account.isActive : true;

      accounts.push(account);
      localStorage.setItem(accountsKey, JSON.stringify(accounts));

      return ok();
    }

    function updateAccount() {
      if (!isAuthenticated()) return unauthorized();

      let params = body;
      let account = accounts.find((x) => x.id === idFromUrl());

      //user accounts can update own profile and admin accounts can update all profiles
      if (account.id !== currentAccount().id && !isAuthorized(Role.Admin)) {
        return unauthorized();
      }

      //only update password if included
      if (!params.password) {
        delete params.password;
      }
      //don't save confirm password
      delete params.confirmPassword;

      //update and save account
      Object.assign(account, params);
      localStorage.setItem(accountsKey, JSON.stringify(accounts));

      return ok(basicDetails(account));
    }

    function deleteAccount() {
      if (!isAuthenticated()) return unauthorized();

      let account = accounts.find((x) => x.id === idFromUrl());

      //user accounts can delete own account and admin account can delete any account
      if (account.id !== currentAccount().id && !isAuthorized(Role.Admin)) {
        return unauthorized();
      }

      //delete account and save
      accounts = accounts.filter((x) => x.id !== idFromUrl());
      localStorage.setItem(accountsKey, JSON.stringify(accounts));
      return ok();
    }

    // Employee functions
    function getEmployees() {
      if (!isAuthenticated()) return unauthorized();

      // Return employees with department and account information for display
      const enrichedEmployees = employees.map((employee) => {
        const department = departments.find(
          (d) => d.id === employee.departmentId
        );
        const account = accounts.find((a) => a.id === employee.userId);

        return {
          ...employee,
          departmentName: department ? department.name : "Unknown Department",
          accountName: account
            ? `${account.firstName} ${account.lastName}`
            : "Unknown Account",
        };
      });

      return ok(enrichedEmployees);
    }

    function createEmployee() {
      if (!isAuthorized(Role.Admin)) return unauthorized();

      const employee = {
        id: employees.length ? Math.max(...employees.map((x) => x.id)) + 1 : 1,
        ...body,
      };

      employees.push(employee);
      localStorage.setItem(employeesKey, JSON.stringify(employees));

      // Recalculate department counts after adding an employee
      recalculateDepartmentCounts();

      return ok(employee);
    }

    function getEmployeeById() {
      if (!isAuthenticated()) return unauthorized();

      const id = idFromUrl();
      const employee = employees.find((e) => e.id === id);

      if (!employee) return error("Employee not found");

      // Add referenced entities for dropdown selection in forms
      const department = departments.find(
        (d) => d.id === employee.departmentId
      );
      const account = accounts.find((a) => a.id === employee.userId);

      const enrichedEmployee = {
        ...employee,
        departmentName: department ? department.name : "Unknown Department",
        accountName: account
          ? `${account.firstName} ${account.lastName}`
          : "Unknown Account",
      };

      return ok(enrichedEmployee);
    }

    function updateEmployee() {
      if (!isAuthorized(Role.Admin)) return unauthorized();

      const id = idFromUrl();
      const employeeIndex = employees.findIndex((e) => e.id === id);

      if (employeeIndex === -1) return error("Employee not found");

      // Store old department ID to check if it changed
      const oldDepartmentId = employees[employeeIndex].departmentId;
      const newDepartmentId = body.departmentId;

      employees[employeeIndex] = {
        ...employees[employeeIndex],
        ...body,
      };

      localStorage.setItem(employeesKey, JSON.stringify(employees));

      // Recalculate department counts if department changed
      if (oldDepartmentId !== newDepartmentId) {
        recalculateDepartmentCounts();
      }

      return ok(employees[employeeIndex]);
    }

    function deleteEmployee() {
      if (!isAuthorized(Role.Admin)) return unauthorized();

      const id = idFromUrl();

      if (!employees.find((e) => e.id === id))
        return error("Employee not found");

      employees = employees.filter((e) => e.id !== id);
      localStorage.setItem(employeesKey, JSON.stringify(employees));

      // Recalculate department counts after removing an employee
      recalculateDepartmentCounts();

      return ok({ message: "Employee deleted" });
    }

    function transferEmployee() {
      if (!isAuthorized(Role.Admin)) return unauthorized();

      // Get the employee ID from the URL correctly
      // The URL format is like /employees/123/transfer, so we need to extract '123'
      const urlParts = url.split("/");
      console.log("Transfer URL parts:", urlParts);

      // Find the 'employees' part and take the next segment as ID
      let employeeIdIndex = -1;
      for (let i = 0; i < urlParts.length; i++) {
        if (urlParts[i] === "employees") {
          employeeIdIndex = i + 1;
          break;
        }
      }

      if (employeeIdIndex === -1 || employeeIdIndex >= urlParts.length) {
        console.error("Invalid URL format for employee transfer");
        return error("Invalid URL format");
      }

      const id = parseInt(urlParts[employeeIdIndex]);
      console.log("Attempting to transfer employee with ID:", id);

      // Log all employees for debugging
      console.log(
        "Available employees:",
        employees.map((e) => ({ id: e.id, employeeId: e.employeeId }))
      );

      const employee = employees.find((e) => e.id === id);
      console.log("Found employee:", employee);

      if (!employee) return error("Employee not found");

      // Log the entire body to debug
      console.log("Request body for transfer:", body);

      // Extract department ID directly from the request
      let targetDepartmentId = null;

      if (body.departmentId) {
        targetDepartmentId = Number(body.departmentId);
      } else if (body.department && body.department.id) {
        targetDepartmentId = Number(body.department.id);
      } else if (body.department) {
        targetDepartmentId = Number(body.department);
      } else if (body.targetDepartment) {
        targetDepartmentId = Number(body.targetDepartment);
      } else if (body.id) {
        targetDepartmentId = Number(body.id);
      }

      console.log("Extracted target department ID:", targetDepartmentId);

      if (!targetDepartmentId) {
        return error("Target department not specified");
      }

      // Find the target department
      const targetDepartment = departments.find(
        (d) => d.id === targetDepartmentId
      );

      console.log("Target department:", targetDepartment);
      if (!targetDepartment) {
        // Log all departments for debugging
        console.log("Available departments:", departments);
        return error(
          `Target department with ID ${targetDepartmentId} not found`
        );
      }

      // Create a workflow for the transfer
      const account = currentAccount();
      const workflow = {
        id: workflows.length ? Math.max(...workflows.map((w) => w.id)) + 1 : 1,
        employeeId: employee.id,
        type: "Department Transfer",
        details: {
          employeeId: employee.id,
          employeeName: employee.employeeId, // Using employeeId as name for display
          currentDepartment:
            departments.find((d) => d.id === employee.departmentId)?.name ||
            "None",
          newDepartment: targetDepartment.name,
          newDepartmentId: targetDepartmentId, // Add the department ID
          requestedBy: `${account.firstName} ${account.lastName}`,
          requestedAt: new Date().toISOString(),
        },
        status: "Pending",
      };

      workflows.push(workflow);
      localStorage.setItem(workflowsKey, JSON.stringify(workflows));

      console.log("Created department transfer workflow:", workflow);

      return ok({
        employee,
        workflow,
        message: "Transfer request has been created and is pending approval.",
      });
    }

    // Department functions
    function getDepartments() {
      if (!isAuthenticated()) return unauthorized();
      return ok(departments);
    }

    function getDepartmentById() {
      if (!isAuthenticated()) return unauthorized();

      const id = idFromUrl();
      const department = departments.find((d) => d.id === id);

      if (!department) return error("Department not found");

      return ok(department);
    }

    function createDepartment() {
      if (!isAuthorized(Role.Admin)) return unauthorized();

      const department = {
        id: departments.length
          ? Math.max(...departments.map((d) => d.id)) + 1
          : 1,
        ...body,
        employeeCount: 0,
      };

      departments.push(department);
      localStorage.setItem(departmentsKey, JSON.stringify(departments));

      return ok(department);
    }

    function updateDepartment() {
      if (!isAuthorized(Role.Admin)) return unauthorized();

      const id = idFromUrl();
      const deptIndex = departments.findIndex((d) => d.id === id);

      if (deptIndex === -1) return error("Department not found");

      departments[deptIndex] = {
        ...departments[deptIndex],
        ...body,
        employeeCount: departments[deptIndex].employeeCount,
      };

      localStorage.setItem(departmentsKey, JSON.stringify(departments));

      return ok(departments[deptIndex]);
    }

    function deleteDepartment() {
      if (!isAuthorized(Role.Admin)) return unauthorized();

      const id = idFromUrl();

      if (!departments.find((d) => d.id === id))
        return error("Department not found");

      departments = departments.filter((d) => d.id !== id);
      localStorage.setItem(departmentsKey, JSON.stringify(departments));

      return ok({ message: "Department deleted" });
    }

    // Workflow functions
    function getEmployeeWorkflows() {
      if (!isAuthenticated()) return unauthorized();

      const employeeId = parseInt(url.split("/").pop());
      const employeeWorkflows = workflows.filter(
        (w) => w.employeeId === employeeId
      );

      return ok(employeeWorkflows);
    }

    function createWorkflow() {
      if (!isAuthorized(Role.Admin)) return unauthorized();

      const workflow = {
        id: workflows.length ? Math.max(...workflows.map((w) => w.id)) + 1 : 1,
        ...body,
      };

      workflows.push(workflow);
      localStorage.setItem(workflowsKey, JSON.stringify(workflows));

      return ok(workflow);
    }

    function updateWorkflow() {
      if (!isAuthorized(Role.Admin)) return unauthorized();

      const id = idFromUrl();
      const workflowIndex = workflows.findIndex((w) => w.id === id);

      if (workflowIndex === -1) return error("Workflow not found");

      // Create the updated workflow object based on existing and new data
      const updatedWorkflow = {
        ...workflows[workflowIndex],
        ...body, // body contains the new status and other workflow properties
      };

      // Check if the status is being updated to Approved or Rejected
      if (
        updatedWorkflow.status === "Approved" ||
        updatedWorkflow.status === "Rejected"
      ) {
        // Update the corresponding request status if this is a request approval workflow
        if (
          updatedWorkflow.type === "Request Approval" &&
          updatedWorkflow.details &&
          updatedWorkflow.details.requestId
        ) {
          const requestId = updatedWorkflow.details.requestId;
          const requestIndex = requests.findIndex((r) => r.id === requestId);

          if (requestIndex !== -1) {
            // Update the request status to match the workflow status
            requests[requestIndex].status = updatedWorkflow.status;
            localStorage.setItem(requestsKey, JSON.stringify(requests));
            console.log(
              `Updated request ${requestId} status to ${updatedWorkflow.status}`
            );
          }
        }

        // Handle department transfer logic if it's an approved department transfer
        if (
          updatedWorkflow.type === "Department Transfer" &&
          updatedWorkflow.status === "Approved"
        ) {
          const employeeId = updatedWorkflow.employeeId;
          const employee = employees.find((e) => e.id === employeeId);

          if (employee && updatedWorkflow.details) {
            // Get new department ID from workflow details
            const newDepartmentId = updatedWorkflow.details.newDepartmentId;

            if (newDepartmentId) {
              // Use department ID directly if available
              employee.departmentId = newDepartmentId;
              localStorage.setItem(employeesKey, JSON.stringify(employees));

              // Recalculate department counts after the transfer
              recalculateDepartmentCounts();
              console.log(
                `Employee ${employeeId} transferred to department ID ${newDepartmentId} via workflow update`
              );
            } else if (updatedWorkflow.details.newDepartment) {
              // Fallback to department name lookup
              const newDepartmentName = updatedWorkflow.details.newDepartment;
              const newDepartment = departments.find(
                (d) => d.name === newDepartmentName
              );

              if (newDepartment) {
                // Update employee's department
                employee.departmentId = newDepartment.id;
                localStorage.setItem(employeesKey, JSON.stringify(employees));

                // Recalculate department counts after the transfer
                recalculateDepartmentCounts();
                console.log(
                  `Employee ${employeeId} transferred to department ${newDepartmentName} via workflow update`
                );
              }
            }
          }
        }
      }

      // Always update the workflow in place, regardless of status
      workflows[workflowIndex] = updatedWorkflow;
      localStorage.setItem(workflowsKey, JSON.stringify(workflows));

      // Return the workflow object that was processed
      return ok(updatedWorkflow);
    }

    function updateWorkflowStatus() {
      if (!isAuthorized(Role.Admin)) return unauthorized();

      const id = idFromUrl();
      const workflowIndex = workflows.findIndex((w) => w.id === id);

      if (workflowIndex === -1) return error("Workflow not found");

      const workflow = workflows[workflowIndex];
      const newStatus = body.status;

      // Update the corresponding request if this is a request approval workflow
      if (
        workflow.type === "Request Approval" &&
        workflow.details &&
        workflow.details.requestId
      ) {
        const requestId = workflow.details.requestId;
        const requestIndex = requests.findIndex((r) => r.id === requestId);

        if (requestIndex !== -1) {
          // Update the request status to match the workflow status
          requests[requestIndex].status = newStatus;
          localStorage.setItem(requestsKey, JSON.stringify(requests));
          console.log(`Updated request ${requestId} status to ${newStatus}`);
        }
      }

      // Handle department transfer when approved
      if (workflow.type === "Department Transfer" && newStatus === "Approved") {
        const employeeId = workflow.employeeId;
        const employee = employees.find((e) => e.id === employeeId);

        if (employee && workflow.details) {
          // Get new department ID from workflow details
          const newDepartmentId = workflow.details.newDepartmentId;

          if (newDepartmentId) {
            // Use department ID directly if available
            employee.departmentId = newDepartmentId;
            localStorage.setItem(employeesKey, JSON.stringify(employees));

            // Recalculate department counts after the transfer
            recalculateDepartmentCounts();
            console.log(
              `Employee ${employeeId} transferred to department ID ${newDepartmentId}`
            );
          } else if (workflow.details.newDepartment) {
            // Fallback to department name lookup
            const newDepartmentName = workflow.details.newDepartment;
            const newDepartment = departments.find(
              (d) => d.name === newDepartmentName
            );

            if (newDepartment) {
              employee.departmentId = newDepartment.id;
              localStorage.setItem(employeesKey, JSON.stringify(employees));

              // Recalculate department counts after the transfer
              recalculateDepartmentCounts();
              console.log(
                `Employee ${employeeId} transferred to department ${newDepartmentName}`
              );
            }
          }
        }
      }

      // Update workflow status
      workflow.status = newStatus;

      // Always keep the workflow in the list and update it
      workflows[workflowIndex] = workflow;
      localStorage.setItem(workflowsKey, JSON.stringify(workflows));

      return ok(workflow);
    }

    // Request functions
    function getRequests() {
      if (!isAuthenticated()) return unauthorized(); // All authenticated users can attempt to get requests

      const acc = currentAccount();
      if (!acc) return unauthorized(); // Should be caught by isAuthenticated, but good practice

      if (acc.role === Role.Admin) {
        // Admin sees all requests
        return ok(requests);
      } else {
        // Regular user sees only their own requests
        const currentUserEmployee = employees.find((e) => e.userId === acc.id);
        if (!currentUserEmployee) {
          // If the user is not linked to an employee record, they have no requests
          return ok([]);
        }
        const userRequests = requests.filter(
          (r) => r.employeeId === currentUserEmployee.id
        );
        return ok(userRequests);
      }
    }

    function createRequest() {
      if (!isAuthenticated()) return unauthorized();

      const account = currentAccount();

      // Convert employeeId to number if it exists (fix for type mismatch)
      if (body.employeeId) {
        body.employeeId = Number(body.employeeId);
      }

      // Only set default employeeId if not provided in request and user is not admin
      if (!body.employeeId) {
        // For both admin and non-admin, if employeeId is not set, use the current user's employee record
        const employee = employees.find((e) => e.userId === account.id);
        if (employee) {
          body.employeeId = employee.id;
        } else if (account.role !== Role.Admin) {
          // Only error for non-admin users - admins can create requests without employee association
          return error("Employee not found for current user");
        }
      }

      // Create a deep copy of the request body to avoid reference issues
      const requestData = JSON.parse(JSON.stringify(body));

      const request = {
        id: requests.length ? Math.max(...requests.map((r) => r.id)) + 1 : 1,
        ...requestData,
      };

      console.log("Creating new request:", request);

      requests.push(request);
      localStorage.setItem(requestsKey, JSON.stringify(requests));

      // Create a corresponding workflow for this request
      if (request.employeeId) {
        const employee = employees.find((e) => e.id === request.employeeId);

        if (employee) {
          const workflow = {
            id: workflows.length
              ? Math.max(...workflows.map((w) => w.id)) + 1
              : 1,
            employeeId: request.employeeId,
            type: "Request Approval",
            details: {
              requestId: request.id,
              requestType: request.type,
              requestItems: JSON.parse(JSON.stringify(request.requestItems)),
              createdBy: `${account.firstName} ${account.lastName}`,
              createdAt: new Date().toISOString(),
            },
            status: "Pending",
          };

          workflows.push(workflow);
          localStorage.setItem(workflowsKey, JSON.stringify(workflows));
          console.log("Created workflow for request:", workflow);
        }
      }

      return ok(request);
    }

    function updateRequest() {
      if (!isAuthorized(Role.Admin)) return unauthorized();

      const id = idFromUrl();
      const reqIndex = requests.findIndex((r) => r.id === id);

      if (reqIndex === -1) return error("Request not found");

      // Convert employeeId to number if it exists (fix for type mismatch)
      if (body.employeeId) {
        body.employeeId = Number(body.employeeId);
      }

      // Create a deep copy of the request body to avoid reference issues
      const requestData = JSON.parse(JSON.stringify(body));

      const oldRequest = requests[reqIndex];
      const updatedRequest = {
        ...oldRequest,
        ...requestData,
      };

      requests[reqIndex] = updatedRequest;
      console.log("Updated request:", updatedRequest);

      localStorage.setItem(requestsKey, JSON.stringify(requests));

      // Update the corresponding workflow if it exists
      // If status has changed, update workflow status accordingly
      const account = currentAccount();
      const relatedWorkflows = workflows.filter(
        (w) =>
          w.type === "Request Approval" &&
          w.details &&
          w.details.requestId === id
      );

      if (relatedWorkflows.length > 0) {
        // Update existing workflow
        relatedWorkflows.forEach((workflow) => {
          workflow.details.requestType = updatedRequest.type;
          workflow.details.requestItems = JSON.parse(
            JSON.stringify(updatedRequest.requestItems)
          );
          workflow.details.updatedBy = `${account.firstName} ${account.lastName}`;
          workflow.details.updatedAt = new Date().toISOString();

          // If request status was updated, reflect in workflow
          if (oldRequest.status !== updatedRequest.status) {
            if (updatedRequest.status === "Approved") {
              workflow.status = "Approved";
            } else if (updatedRequest.status === "Rejected") {
              workflow.status = "Rejected";
            }
          }
        });
      } else if (updatedRequest.employeeId) {
        // No existing workflow found, create a new one
        const employee = employees.find(
          (e) => e.id === updatedRequest.employeeId
        );

        if (employee) {
          const workflow = {
            id: workflows.length
              ? Math.max(...workflows.map((w) => w.id)) + 1
              : 1,
            employeeId: updatedRequest.employeeId,
            type: "Request Approval",
            details: {
              requestId: updatedRequest.id,
              requestType: updatedRequest.type,
              requestItems: JSON.parse(
                JSON.stringify(updatedRequest.requestItems)
              ),
              createdBy: `${account.firstName} ${account.lastName}`,
              createdAt: new Date().toISOString(),
            },
            status: "Pending",
          };

          workflows.push(workflow);
          console.log("Created workflow for updated request:", workflow);
        }
      }

      localStorage.setItem(workflowsKey, JSON.stringify(workflows));

      return ok(updatedRequest);
    }

    function deleteRequest() {
      if (!isAuthorized(Role.Admin)) return unauthorized();

      const id = idFromUrl();

      if (!requests.find((r) => r.id === id)) return error("Request not found");

      requests = requests.filter((r) => r.id !== id);
      localStorage.setItem(requestsKey, JSON.stringify(requests));

      return ok({ message: "Request deleted" });
    }

    function getRequestById() {
      if (!isAuthenticated()) return unauthorized();

      console.log("Getting request by ID");
      const id = idFromUrl();
      console.log("Request ID from URL:", id);

      const request = requests.find((r) => r.id === id);
      console.log("Found request:", request);

      if (!request) return error("Request not found");

      // Important: Create a deep copy of the request to avoid reference issues
      const requestCopy = JSON.parse(JSON.stringify(request));
      console.log("Returning request copy:", requestCopy);

      return ok(requestCopy);
    }

    //helper functions

    function ok(body?) {
      return of(new HttpResponse({ status: 200, body })).pipe(delay(500)); //delay observalbe to simulate server api call
    }

    function error(message) {
      return throwError({ error: { message } }).pipe(
        materialize(),
        delay(500),
        dematerialize()
      );
      // call materialize and dematerialize to ensure delay even if an error is thrown
    }

    function unauthorized() {
      return throwError({
        status: 401,
        error: { message: "Unauthorized" },
      }).pipe(materialize(), delay(500), dematerialize());
    }

    function basicDetails(account) {
      const {
        id,
        title,
        firstName,
        lastName,
        email,
        role,
        dateCreated,
        isVerified,
        isActive,
      } = account;
      return {
        id,
        title,
        firstName,
        lastName,
        email,
        role,
        dateCreated,
        isVerified,
        isActive: isActive !== undefined ? isActive : true, // Ensure isActive has a default value
      };
    }

    function isAuthenticated() {
      return !!currentAccount();
    }

    function isAuthorized(role) {
      const account = currentAccount();
      if (!account) return false;
      return account.role === role;
    }

    function idFromUrl() {
      const urlParts = url.split("/");
      const id = parseInt(urlParts[urlParts.length - 1]);
      console.log("URL parts:", urlParts, "Extracted ID:", id);
      return id;
    }

    function newAccountId() {
      //create random id for new account
      return accounts.length ? Math.max(...accounts.map((x) => x.id)) + 1 : 1;
    }

    function currentAccount() {
      //check if jwt token is in auth header
      const authHeader = headers.get("Authorization");
      if (!authHeader.startsWith("Bearer fake-jwt-token")) return;

      //check if token is expired
      const jwtToken = JSON.parse(atob(authHeader.split(".")[1]));
      const tokenExpired = Date.now() > jwtToken.exp * 1000;
      if (tokenExpired) return;

      const account = accounts.find((x) => x.id === jwtToken.id);
      return account;
    }

    function generateJwtToken(account) {
      //create token that expires in 15 minutes
      const tokenPayLoad = {
        exp: Math.round(new Date(Date.now() + 15 * 60 * 1000).getTime() / 1000),
        id: account.id,
      };

      return `fake-jwt-token.${btoa(JSON.stringify(tokenPayLoad))}`;
    }

    function generateRefreshToken() {
      const token = new Date().getTime().toString();

      //add token cookie that expires in 7days
      const expires = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toUTCString();
      document.cookie = `fakeRefreshToken=${token}; expires=${expires}; path=/`;
      return token;
    }

    function getRefreshToken() {
      //get refresh token from cookei
      return (
        document.cookie
          .split(";")
          .find((x) => x.includes(`fakeRefreshToken`)) || "="
      ).split("=")[1];
    }
  }
}

export let fakeBackendProvider = {
  //use fake backend in place of Http service for backend-less development
  provide: HTTP_INTERCEPTORS,
  useClass: FakeBackendInterceptor,
  multi: true,
};
