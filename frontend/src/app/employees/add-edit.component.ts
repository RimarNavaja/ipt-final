import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AccountService, EmployeeService, DepartmentService } from '@app/_services';
import { first } from 'rxjs/operators';

@Component({
  templateUrl: './add-edit.component.html'
})
export class AddEditComponent implements OnInit {
  id: string;
  employee: any = {};
  departments = [];
  users = [];
  errorMessage = '';

  constructor(
    private employeeService: EmployeeService,
    private departmentService: DepartmentService,
    private accountService: AccountService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.id = this.route.snapshot.params['id'];
    
    // Load departments
    this.departmentService.getAll()
      .pipe(first())
      .subscribe(departments => {
        this.departments = departments;
      });
    
    // Load users for dropdown
    this.accountService.getAll()
      .pipe(first())
      .subscribe(users => {
        this.users = users;
      });
    
    if (this.id) {
      // Edit mode - fetch employee data
      this.employeeService.getById(+this.id)
        .pipe(first())
        .subscribe(employee => {
          this.employee = employee;
        });
    }
  }

  save() {
    if (this.id) {
      // Update existing employee
      this.employeeService.update(+this.id, this.employee)
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
      this.employeeService.create(this.employee)
        .pipe(first())
        .subscribe({
          next: () => {
            this.router.navigate(['employees']);
          },
          error: error => {
            this.errorMessage = error.error?.message || 'An error occurred';
          }
        });
    }
  }

  cancel() {
    this.router.navigate(['employees']);
  }
} 