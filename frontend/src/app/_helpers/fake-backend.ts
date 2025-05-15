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
let accounts = JSON.parse(localStorage.getItem(accountsKey)) || [];

// arrays for employees, departments, workflows, and requests
const employeesKey = "employees";
const departmentsKey = "departments";
const workflowsKey = "workflows";
const requestsKey = "requests";

let employees = JSON.parse(localStorage.getItem(employeesKey)) || [
  { id: 1, employeeId: 'EMP001', userId: 1, position: 'Developer', departmentId: 1, hireDate: '2025-01-01', status: 'Active' },
  { id: 2, employeeId: 'EMP002', userId: 2, position: 'Designer', departmentId: 2, hireDate: '2025-02-01', status: 'Active' }
];

let departments = JSON.parse(localStorage.getItem(departmentsKey)) || [
  { id: 1, name: 'Engineering', description: 'Software development team', employeeCount: 1 },
  { id: 2, name: 'Marketing', description: 'Marketing team', employeeCount: 1 }
];

let workflows = JSON.parse(localStorage.getItem(workflowsKey)) || [
  { id: 1, employeeId: 1, type: 'Onboarding', details: { task: 'Setup workstation' }, status: 'Pending' }
];

let requests = JSON.parse(localStorage.getItem(requestsKey)) || [
  { id: 1, employeeId: 2, type: 'Equipment', requestItems: [{ name: 'Laptop', quantity: 1 }], status: 'Pending' }
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

    return handleRoute();

    function handleRoute() {
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
        case url.match(/\/accounts\/\d+$/) && method === "GET":
          return getAccountById();
        case url.endsWith("/accounts") && method === "POST":
          return createAccount();
        case url.match(/\/accounts\/\d+$/) && method === "PUT":
          return updateAccount();
        case url.match(/\/accounts\/\d+$/) && method === "DELETE":
          return deleteAccount();
          
        // Employee routes
        case url.endsWith('/employees') && method === 'GET':
          return getEmployees();
        case url.endsWith('/employees') && method === 'POST':
          return createEmployee();
        case url.match(/\/employees\/\d+$/) && method === 'GET':
          return getEmployeeById();
        case url.match(/\/employees\/\d+$/) && method === 'PUT':
          return updateEmployee();
        case url.match(/\/employees\/\d+$/) && method === 'DELETE':
          return deleteEmployee();
        case url.match(/\/employees\/\d+\/transfer$/) && method === 'POST':
          return transferEmployee();
          
        // Department routes
        case url.endsWith('/departments') && method === 'GET':
          return getDepartments();
        case url.endsWith('/departments') && method === 'POST':
          return createDepartment();
        case url.match(/\/departments\/\d+$/) && method === 'PUT':
          return updateDepartment();
        case url.match(/\/departments\/\d+$/) && method === 'DELETE':
          return deleteDepartment();
          
        // Workflow routes
        case url.match(/\/workflows\/employee\/\d+$/) && method === 'GET':
          return getEmployeeWorkflows();
        case url.endsWith('/workflows') && method === 'POST':
          return createWorkflow();
          
        // Request routes
        case url.endsWith('/requests') && method === 'GET':
          return getRequests();
        case url.endsWith('/requests') && method === 'POST':
          return createRequest();
        case url.match(/\/requests\/\d+$/) && method === 'PUT':
          return updateRequest();
        case url.match(/\/requests\/\d+$/) && method === 'DELETE':
          return deleteRequest();
          
        default:
          // pass through any requests not handled above
          return next.handle(request);
      }
    }

    //route functions
    function authenticate() {
      const { email, password } = body;
      const account = accounts.find(
        (x) => x.email === email && x.password === password && x.isVerified
      );

      if (!account) return error("Email or password is incorrect");

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
      accounts.push(account);
      localStorage.setItem(accountsKey, JSON.stringify(accounts));

      return ok();
    }

    function updateAccount() {
      if (!isAuthenticated()) return unauthorized();

      const params = body;
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
      return ok(employees);
    }

    function createEmployee() {
      if (!isAuthorized(Role.Admin)) return unauthorized();
      
      const employee = { 
        id: employees.length ? Math.max(...employees.map(x => x.id)) + 1 : 1,
        ...body 
      };
      
      employees.push(employee);
      localStorage.setItem(employeesKey, JSON.stringify(employees));
      
      return ok(employee);
    }

    function getEmployeeById() {
      if (!isAuthenticated()) return unauthorized();
      
      const id = idFromUrl();
      const employee = employees.find(e => e.id === id);
      
      if (!employee) return error('Employee not found');
      
      return ok(employee);
    }

    function updateEmployee() {
      if (!isAuthorized(Role.Admin)) return unauthorized();
      
      const id = idFromUrl();
      const employeeIndex = employees.findIndex(e => e.id === id);
      
      if (employeeIndex === -1) return error('Employee not found');
      
      employees[employeeIndex] = { 
        ...employees[employeeIndex],
        ...body 
      };
      
      localStorage.setItem(employeesKey, JSON.stringify(employees));
      
      return ok(employees[employeeIndex]);
    }

    function deleteEmployee() {
      if (!isAuthorized(Role.Admin)) return unauthorized();
      
      const id = idFromUrl();
      
      if (!employees.find(e => e.id === id)) return error('Employee not found');
      
      employees = employees.filter(e => e.id !== id);
      localStorage.setItem(employeesKey, JSON.stringify(employees));
      
      return ok({ message: 'Employee deleted' });
    }

    function transferEmployee() {
      if (!isAuthorized(Role.Admin)) return unauthorized();
      
      const id = parseInt(url.split('/')[2]);
      const employee = employees.find(e => e.id === id);
      
      if (!employee) return error('Employee not found');
      
      employee.departmentId = body.departmentId;
      localStorage.setItem(employeesKey, JSON.stringify(employees));
      
      return ok(employee);
    }

    // Department functions
    function getDepartments() {
      if (!isAuthenticated()) return unauthorized();
      return ok(departments);
    }

    function createDepartment() {
      if (!isAuthorized(Role.Admin)) return unauthorized();
      
      const department = {
        id: departments.length ? Math.max(...departments.map(d => d.id)) + 1 : 1,
        ...body,
        employeeCount: 0
      };
      
      departments.push(department);
      localStorage.setItem(departmentsKey, JSON.stringify(departments));
      
      return ok(department);
    }

    function updateDepartment() {
      if (!isAuthorized(Role.Admin)) return unauthorized();
      
      const id = idFromUrl();
      const deptIndex = departments.findIndex(d => d.id === id);
      
      if (deptIndex === -1) return error('Department not found');
      
      departments[deptIndex] = {
        ...departments[deptIndex],
        ...body,
        employeeCount: departments[deptIndex].employeeCount
      };
      
      localStorage.setItem(departmentsKey, JSON.stringify(departments));
      
      return ok(departments[deptIndex]);
    }

    function deleteDepartment() {
      if (!isAuthorized(Role.Admin)) return unauthorized();
      
      const id = idFromUrl();
      
      if (!departments.find(d => d.id === id)) return error('Department not found');
      
      departments = departments.filter(d => d.id !== id);
      localStorage.setItem(departmentsKey, JSON.stringify(departments));
      
      return ok({ message: 'Department deleted' });
    }

    // Workflow functions
    function getEmployeeWorkflows() {
      if (!isAuthenticated()) return unauthorized();
      
      const employeeId = parseInt(url.split('/').pop());
      const employeeWorkflows = workflows.filter(w => w.employeeId === employeeId);
      
      return ok(employeeWorkflows);
    }

    function createWorkflow() {
      if (!isAuthorized(Role.Admin)) return unauthorized();
      
      const workflow = {
        id: workflows.length ? Math.max(...workflows.map(w => w.id)) + 1 : 1,
        ...body
      };
      
      workflows.push(workflow);
      localStorage.setItem(workflowsKey, JSON.stringify(workflows));
      
      return ok(workflow);
    }

    // Request functions
    function getRequests() {
      if (!isAuthorized(Role.Admin)) return unauthorized();
      return ok(requests);
    }

    function createRequest() {
      if (!isAuthenticated()) return unauthorized();
      
      const account = currentAccount();
      const employee = employees.find(e => e.userId === account.id);
      
      if (!employee) return error('Employee not found for current user');
      
      const request = {
        id: requests.length ? Math.max(...requests.map(r => r.id)) + 1 : 1,
        employeeId: employee.id,
        ...body
      };
      
      requests.push(request);
      localStorage.setItem(requestsKey, JSON.stringify(requests));
      
      return ok(request);
    }

    function updateRequest() {
      if (!isAuthorized(Role.Admin)) return unauthorized();
      
      const id = idFromUrl();
      const reqIndex = requests.findIndex(r => r.id === id);
      
      if (reqIndex === -1) return error('Request not found');
      
      requests[reqIndex] = {
        ...requests[reqIndex],
        ...body
      };
      
      localStorage.setItem(requestsKey, JSON.stringify(requests));
      
      return ok(requests[reqIndex]);
    }

    function deleteRequest() {
      if (!isAuthorized(Role.Admin)) return unauthorized();
      
      const id = idFromUrl();
      
      if (!requests.find(r => r.id === id)) return error('Request not found');
      
      requests = requests.filter(r => r.id !== id);
      localStorage.setItem(requestsKey, JSON.stringify(requests));
      
      return ok({ message: 'Request deleted' });
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
      return parseInt(urlParts[urlParts.length - 1]);
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
