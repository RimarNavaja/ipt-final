import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AccountService, DepartmentService } from '@app/_services';
import { first } from 'rxjs/operators';

@Component({
  templateUrl: './list.component.html'
})
export class ListComponent implements OnInit {
  departments = [];

  constructor(
    private departmentService: DepartmentService,
    private accountService: AccountService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadDepartments();
  }

  account() {
    return this.accountService.accountValue;
  }

  loadDepartments() {
    this.departmentService.getAll()
      .pipe(first())
      .subscribe(departments => {
        this.departments = departments;
      });
  }

  add() {
    this.router.navigate(['departments/add']);
  }

  edit(id: number) {
    this.router.navigate(['departments/edit', id]);
  }

  delete(id: number) {
    if (confirm('Are you sure you want to delete this department?')) {
      this.departmentService.delete(id)
        .pipe(first())
        .subscribe(() => {
          this.loadDepartments();
        });
    }
  }
} 