import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AccountService, EmployeeService } from '@app/_services';
import { first, catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

@Component({
  templateUrl: './list.component.html'
})
export class ListComponent implements OnInit {
  employees = [];
  accounts = [];
  departments = [];
  loading = true;

  constructor(
    private employeeService: EmployeeService,
    private router: Router,
    private accountService: AccountService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadEmployees();
  }

  account() {
    return this.accountService.accountValue;
  }

  loadEmployees() {
    this.loading = true;
    const departmentsUrl = environment.apiUrl ? `${environment.apiUrl}/departments` : '/departments';
    
    // Load accounts, employees, and departments in parallel
    forkJoin({
      accounts: this.accountService.getAll().pipe(catchError(error => {
        console.error('Error loading accounts:', error);
        return of([]);
      })),
      employees: this.employeeService.getAll().pipe(catchError(error => {
        console.error('Error loading employees:', error);
        return of([]);
      })),
      departments: this.http.get<any[]>(departmentsUrl).pipe(catchError(error => {
        console.error('Error loading departments:', error);
        return of([]);
      }))
    })
    .pipe(first())
    .subscribe(result => {
      this.accounts = result.accounts;
      this.departments = result.departments;
      
      // Merge employee data with account and department data
      this.employees = result.employees.map(employee => {
        // Find matching account and department
        const account = result.accounts.find(a => a.id === employee.userId);
        const department = result.departments.find(d => d.id === parseInt(employee.departmentId));
        
        return {
          ...employee,
          user: account || null,
          department: department || null
        };
      });
      
      this.loading = false;
      console.log('Employees loaded:', this.employees);
    }, error => {
      console.error('Error in forkJoin:', error);
      this.loading = false;
    });
  }

  add() {
    this.router.navigate(['employees/add']);
  }

  edit(id: number) {
    this.router.navigate(['employees/edit', id]);
  }

  delete(id: number) {
    if (confirm('Are you sure you want to delete this employee?')) {
      this.employeeService.delete(id)
        .pipe(first())
        .subscribe(() => {
          this.loadEmployees();
        });
    }
  }

  transfer(employee: any) {
    this.router.navigate(['employees/transfer', employee.id]);
  }

  viewWorkflows(id: number) {
    this.router.navigate(['workflows', id]);
  }

  viewRequests(id: number) {
    this.router.navigate(['requests', id]);
  }
} 