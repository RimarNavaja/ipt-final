import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AccountService, EmployeeService, DepartmentService } from '@app/_services';
import { first } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';

@Component({
  templateUrl: './add-edit.component.html'
})
export class AddEditComponent implements OnInit {
  id: string;
  employee: any = {
    status: 'Active'
  };
  departments = [];
  users = [];
  employees = [];
  errorMessage = '';
  loading = true;
  debugInfo = '';

  constructor(
    private employeeService: EmployeeService,
    private departmentService: DepartmentService,
    private accountService: AccountService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.id = this.route.snapshot.params['id'];
    
    // Load all required data in parallel
    forkJoin({
      departments: this.departmentService.getAll().pipe(first()),
      users: this.accountService.getAll().pipe(first()),
      employees: this.employeeService.getAll().pipe(first()),
      employee: this.id ? this.employeeService.getById(+this.id).pipe(first()) : of(null)
    }).subscribe(results => {
      this.departments = results.departments;
      this.users = results.users;
      this.employees = results.employees;
      
      if (this.id && results.employee) {
        // Edit mode - set employee data
        this.employee = results.employee;
      } else {
        // Add mode - generate next employee ID
        this.generateNextEmployeeId();
      }
      
      this.loading = false;
    });
  }

  onAccountChange(event) {
    // Ensure userId is a number
    if (this.employee.userId) {
      this.employee.userId = Number(this.employee.userId);
    }
  }

  onDepartmentChange(event) {
    // Ensure departmentId is a number
    if (this.employee.departmentId) {
      this.employee.departmentId = Number(this.employee.departmentId);
    }
  }

  generateNextEmployeeId() {
    if (!this.employees || this.employees.length === 0) {
      this.employee.employeeId = 'EMP001';
      return;
    }
    
    // Find the highest existing employee ID number
    let maxIdNum = 0;
    
    this.employees.forEach(emp => {
      if (emp.employeeId && emp.employeeId.startsWith('EMP')) {
        const idNum = parseInt(emp.employeeId.substring(3), 10);
        if (!isNaN(idNum) && idNum > maxIdNum) {
          maxIdNum = idNum;
        }
      }
    });
    
    // Generate next ID with proper padding
    const nextIdNum = maxIdNum + 1;
    this.employee.employeeId = 'EMP' + nextIdNum.toString().padStart(3, '0');
  }

  save() {
    if (!this.validateForm()) {
      return;
    }
    
    // Ensure proper type conversion for IDs
    const employeeData = {
      ...this.employee,
      userId: Number(this.employee.userId),
      departmentId: Number(this.employee.departmentId)
    };
    
    if (this.id) {
      // Update existing employee
      this.employeeService.update(+this.id, employeeData)
        .pipe(first())
        .subscribe({
          next: () => {
            this.router.navigate(['employees']);
          },
          error: error => {
            this.errorMessage = error.error?.message || 'An error occurred';
          }
        });
    } else {
      // Create new employee
      this.employeeService.create(employeeData)
        .pipe(first())
        .subscribe({
          next: () => {
            this.router.navigate(['employees']);
          },
          error: error => {
            this.errorMessage = error.error?.message || 'An error occurred';
            console.error('Error creating employee:', error);
          }
        });
    }
  }

  validateForm() {
    this.errorMessage = '';
    
    if (!this.employee.employeeId) {
      this.errorMessage = 'Employee ID is required';
      return false;
    }
    
    if (!this.employee.userId) {
      this.errorMessage = 'Account is required';
      return false;
    }
    
    if (!this.employee.position) {
      this.errorMessage = 'Position is required';
      return false;
    }
    
    if (!this.employee.departmentId) {
      this.errorMessage = 'Department is required';
      return false;
    }
    
    if (!this.employee.hireDate) {
      this.errorMessage = 'Hire Date is required';
      return false;
    }
    
    return true;
  }

  cancel() {
    this.router.navigate(['employees']);
  }
} 