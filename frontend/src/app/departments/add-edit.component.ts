import { Component, OnInit } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { DepartmentService } from "@app/_services";
import { first } from "rxjs/operators";

@Component({
  templateUrl: "./add-edit.component.html",
})
export class AddEditComponent implements OnInit {
  id: string;
  department: any = {};
  errorMessage = "";

  constructor(
    private departmentService: DepartmentService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.id = this.route.snapshot.params["id"];
    console.log("Department component initialized with ID:", this.id);

    if (this.id) {
      // Edit mode - fetch department data
      console.log("Fetching department with ID:", this.id);
      this.departmentService
        .getById(+this.id)
        .pipe(first())
        .subscribe(
          (department) => {
            console.log("Department data loaded:", department);
            this.department = department;
          },
          (error) => {
            console.error("Error loading department:", error);
            this.errorMessage = "Error loading department details";
          }
        );
    }
  }

  save() {
    if (this.id) {
      // Update existing department
      this.departmentService
        .update(+this.id, this.department)
        .pipe(first())
        .subscribe({
          next: () => {
            this.router.navigate(["departments"]);
          },
          error: (error) => {
            this.errorMessage = error.error?.message || "An error occurred";
          },
        });
    } else {
      // Create new department
      this.departmentService
        .create(this.department)
        .pipe(first())
        .subscribe({
          next: () => {
            this.router.navigate(["departments"]);
          },
          error: (error) => {
            this.errorMessage = error.error?.message || "An error occurred";
          },
        });
    }
  }

  cancel() {
    this.router.navigate(["departments"]);
  }
}
