import { Component, OnInit } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import {
  EmployeeService,
  DepartmentService,
  AlertService,
} from "@app/_services";
import { first } from "rxjs/operators";

@Component({
  templateUrl: "./transfer.component.html",
  styles: [
    `
      .modal.fade.show {
        animation: fadeIn 0.3s ease-in-out;
      }
      .modal-dialog {
        animation: slideIn 0.3s ease-in-out;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes slideIn {
        from {
          transform: translateY(-50px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
    `,
  ],
})
export class TransferComponent implements OnInit {
  id: string;
  employee: any = {};
  departments = [];
  selectedDepartmentId: number;
  errorMessage = "";

  constructor(
    private employeeService: EmployeeService,
    private departmentService: DepartmentService,
    private alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.id = this.route.snapshot.params["id"];

    // Load departments
    this.departmentService
      .getAll()
      .pipe(first())
      .subscribe((departments) => {
        this.departments = departments;
      });

    // Load employee data
    this.employeeService
      .getById(+this.id)
      .pipe(first())
      .subscribe((employee) => {
        this.employee = employee;
        this.selectedDepartmentId = +employee.departmentId;
      });
  }

  onDepartmentChange(event) {
    // Ensure departmentId is a number
    if (this.selectedDepartmentId) {
      this.selectedDepartmentId = Number(this.selectedDepartmentId);
    }
  }

  transfer() {
    if (!this.selectedDepartmentId) {
      this.errorMessage = "Please select a department";
      return;
    }

    // Ensure the ID is numeric
    const departmentId = Number(this.selectedDepartmentId);

    // Get the new department name
    const newDept = this.departments.find((d) => d.id === departmentId);

    if (!newDept) {
      this.errorMessage = "Selected department not found";
      return;
    }

    // Use the employee service to handle the transfer
    this.employeeService
      .transfer(+this.id, departmentId)
      .pipe(first())
      .subscribe({
        next: () => {
          this.alertService.success("Transfer request created successfully", {
            keepAfterRouteChange: true,
          });
          this.router.navigate(["employees"]);
        },
        error: (error) => {
          this.errorMessage =
            error.error?.message || "An error occurred during transfer request";
          console.error("Transfer error:", error);
        },
      });
  }

  cancel() {
    this.router.navigate(["employees"]);
  }
}
