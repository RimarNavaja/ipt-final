import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { EmployeeService, DepartmentService } from '@app/_services';
import { first } from 'rxjs/operators';

@Component({
  templateUrl: './transfer.component.html'
})
export class TransferComponent implements OnInit {
  id: string;
  employee: any = {};
  departments = [];
  selectedDepartmentId: number;
  errorMessage = '';

  constructor(
    private employeeService: EmployeeService,
    private departmentService: DepartmentService,
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
      
    // Load employee data
    this.employeeService.getById(+this.id)
      .pipe(first())
      .subscribe(employee => {
        this.employee = employee;
        this.selectedDepartmentId = employee.departmentId;
      });
  }

  transfer() {
    this.employeeService.transfer(+this.id, this.selectedDepartmentId)
      .pipe(first())
      .subscribe({
        next: () => {
          this.router.navigate(['employees']);
        },
        error: error => {
          this.errorMessage = error.error?.message || 'An error occurred during transfer';
        }
      });
  }

  cancel() {
    this.router.navigate(['employees']);
  }
} 