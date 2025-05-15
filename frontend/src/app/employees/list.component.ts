import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AccountService, EmployeeService } from '@app/_services';
import { first } from 'rxjs/operators';

@Component({
  templateUrl: './list.component.html'
})
export class ListComponent implements OnInit {
  employees = [];

  constructor(
    private employeeService: EmployeeService,
    private router: Router,
    private accountService: AccountService
  ) {}

  ngOnInit() {
    this.loadEmployees();
  }

  account() {
    return this.accountService.accountValue;
  }

  loadEmployees() {
    this.employeeService.getAll()
      .pipe(first())
      .subscribe(employees => {
        this.employees = employees;
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