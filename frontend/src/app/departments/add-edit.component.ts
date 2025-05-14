import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DepartmentService } from '@app/_services';
import { first } from 'rxjs/operators';

@Component({
  templateUrl: './add-edit.component.html'
})
export class AddEditComponent implements OnInit {
  id: string;
  department: any = {};
  errorMessage = '';

  constructor(
    private departmentService: DepartmentService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.id = this.route.snapshot.params['id'];
    
    if (this.id) {
      // Edit mode - fetch department data
      this.departmentService.getById(+this.id)
        .pipe(first())
        .subscribe(department => {
          this.department = department;
        });
    }
  }

  save() {
    if (this.id) {
      // Update existing department
      this.departmentService.update(+this.id, this.department)
        .pipe(first())
        .subscribe({
          next: () => {
            this.router.navigate(['departments']);
          },
          error: error => {
            this.errorMessage = error.error?.message || 'An error occurred';
          }
        });
    } else {
      // Create new department
      this.departmentService.create(this.department)
        .pipe(first())
        .subscribe({
          next: () => {
            this.router.navigate(['departments']);
          },
          error: error => {
            this.errorMessage = error.error?.message || 'An error occurred';
          }
        });
    }
  }

  cancel() {
    this.router.navigate(['departments']);
  }
} 