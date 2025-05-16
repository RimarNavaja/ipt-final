import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { Router } from "@angular/router";
import {
  AccountService,
  RequestService,
  EmployeeService,
} from "@app/_services";
import { first, catchError } from "rxjs/operators";
import { forkJoin, of } from "rxjs";

@Component({
  templateUrl: "./list.component.html",
})
export class ListComponent implements OnInit {
  @ViewChild("addRequestModal") addRequestModal: ElementRef;
  requests = [];
  employees = [];
  loading = true;
  // isAddModalVisible = false; // We'll use Bootstrap's JS for modal toggling

  // Store a reference to the Bootstrap modal instance
  private bsAddRequestModal: any;

  constructor(
    private requestService: RequestService,
    private accountService: AccountService,
    private employeeService: EmployeeService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadRequests();
  }

  ngAfterViewInit() {
    // Initialize Bootstrap modal instance after view is initialized
    // Ensure Bootstrap's JavaScript is loaded for this to work
    if (
      typeof (window as any).bootstrap !== "undefined" &&
      typeof (window as any).bootstrap.Modal !== "undefined"
    ) {
      this.bsAddRequestModal = new (window as any).bootstrap.Modal(
        this.addRequestModal.nativeElement
      );
    } else {
      console.error(
        "Bootstrap Modal JS not found. Make sure Bootstrap JS is included."
      );
    }
  }

  account() {
    return this.accountService.accountValue;
  }

  loadRequests() {
    this.loading = true;

    // Load employees and requests in parallel
    forkJoin({
      employees: this.employeeService.getAll().pipe(
        catchError((error) => {
          console.error("Error loading employees:", error);
          return of([]);
        })
      ),
      requests: this.requestService.getAll().pipe(
        catchError((error) => {
          console.error("Error loading requests:", error);
          return of([]);
        })
      ),
    })
      .pipe(first())
      .subscribe(
        (result) => {
          this.employees = result.employees;

          // Debug logging
          console.log("Employees:", this.employees);
          console.log("Raw requests:", result.requests);

          // Merge request data with employee data
          this.requests = result.requests.map((request) => {
            // Ensure employeeId is treated as a number for comparison
            const employeeId = request.employeeId
              ? Number(request.employeeId)
              : null;
            const employee = employeeId
              ? result.employees.find((e) => e.id === employeeId)
              : null;

            if (employeeId && !employee) {
              console.warn(
                `Could not find employee with ID ${employeeId} for request ID ${request.id}`
              );
            }

            return {
              ...request,
              employee: employee || null,
            };
          });

          console.log("Processed requests with employees:", this.requests);

          this.loading = false;
        },
        (error) => {
          console.error("Error in forkJoin:", error);
          this.loading = false;
        }
      );
  }

  openAddModal() {
    // Reset the add/edit component (if needed, e.g. clearing previous form data)
    // This might require a method in AddEditComponent to reset its state, called via @ViewChild if app-add-edit-request is a direct child
    if (this.bsAddRequestModal) {
      this.bsAddRequestModal.show();
    }
  }

  closeAddModal() {
    if (this.bsAddRequestModal) {
      this.bsAddRequestModal.hide();
    }
  }

  handleRequestSaved() {
    this.closeAddModal();
    this.loadRequests(); // Refresh the list
  }

  edit(id: number) {
    this.router.navigate(["/requests/edit", id]);
  }

  delete(id: number) {
    if (confirm("Are you sure you want to delete this request?")) {
      this.requestService
        .delete(id)
        .pipe(first())
        .subscribe(() => {
          this.loadRequests();
        });
    }
  }
}
