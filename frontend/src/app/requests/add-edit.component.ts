import { Component, OnInit, Output, EventEmitter } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import {
  AccountService,
  RequestService,
  EmployeeService,
} from "@app/_services";
import { first, switchMap } from "rxjs/operators";
import { Role } from "@app/_models";
import { of } from "rxjs";

@Component({
  selector: "app-add-edit-request",
  templateUrl: "./add.edit.component.html",
})
export class AddEditComponent implements OnInit {
  @Output() requestSaved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  id: string;
  request: any = {
    type: "Equipment",
    requestItems: [{ name: "", quantity: 1 }],
    status: "Pending",
  };
  errorMessage = "";
  isAdmin = false;
  employees = [];
  submitted = false;
  isModalMode = false;

  constructor(
    private requestService: RequestService,
    private accountService: AccountService,
    private employeeService: EmployeeService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Check if current user is admin
    this.isAdmin = this.accountService.accountValue?.role === Role.Admin;

    // Check if we're in modal mode (no route params) or route mode
    this.isModalMode = !this.route.snapshot.params["id"];
  }

  ngOnInit() {
    this.id = this.route.snapshot.params["id"];
    console.log("Component initialized with ID:", this.id);
    console.log("isModalMode:", this.isModalMode);

    // Load employees first (for both create and edit modes)
    if (this.isAdmin) {
      console.log("Admin user detected, loading employees");
      this.employeeService
        .getAll()
        .pipe(
          first(),
          switchMap((employees) => {
            this.employees = employees;
            console.log("Employees loaded:", this.employees);

            // After loading employees, fetch request data if in edit mode
            if (this.id) {
              console.log(
                "Edit mode detected, fetching request with ID:",
                this.id
              );
              return this.requestService.getById(+this.id).pipe(first());
            }
            return of(null);
          })
        )
        .subscribe(
          (request) => {
            if (request) {
              console.log("Loaded request data:", request);
              this.request = request;

              // Make sure employeeId is a number for correct dropdown selection
              if (this.request.employeeId) {
                this.request.employeeId = Number(this.request.employeeId);
                console.log(
                  "Converted employeeId to number:",
                  this.request.employeeId
                );
              }

              // Ensure requestItems is properly initialized
              if (
                !this.request.requestItems ||
                this.request.requestItems.length === 0
              ) {
                this.request.requestItems = [{ name: "", quantity: 1 }];
                console.log("Initialized empty requestItems");
              } else {
                console.log("Request items found:", this.request.requestItems);
              }
            } else {
              console.log("No request data returned for ID:", this.id);
            }
          },
          (error) => {
            console.error("Error loading request:", error);
            this.errorMessage = "Error loading request details";
          }
        );
    } else if (this.id) {
      // Non-admin user in edit mode
      console.log(
        "Non-admin user in edit mode, fetching request with ID:",
        this.id
      );
      this.requestService
        .getById(+this.id)
        .pipe(first())
        .subscribe(
          (request) => {
            console.log("Loaded request data (non-admin):", request);
            this.request = request;

            // Ensure requestItems is properly initialized
            if (
              !this.request.requestItems ||
              this.request.requestItems.length === 0
            ) {
              this.request.requestItems = [{ name: "", quantity: 1 }];
              console.log("Initialized empty requestItems (non-admin)");
            } else {
              console.log(
                "Request items found (non-admin):",
                this.request.requestItems
              );
            }
          },
          (error) => {
            console.error("Error loading request (non-admin):", error);
            this.errorMessage = "Error loading request details";
          }
        );
    }
  }

  addItem() {
    this.request.requestItems.push({ name: "", quantity: 1 });
  }

  removeItem(index: number) {
    this.request.requestItems.splice(index, 1);

    // Always keep at least one item
    if (this.request.requestItems.length === 0) {
      this.request.requestItems = [{ name: "", quantity: 1 }];
    }
  }

  save() {
    this.submitted = true;

    // Remove any empty items
    this.request.requestItems = this.request.requestItems.filter(
      (item) => item.name.trim() !== ""
    );

    // Always keep at least one item
    if (this.request.requestItems.length === 0) {
      this.request.requestItems = [{ name: "", quantity: 1 }];
      this.errorMessage = "Please add at least one item with a name";
      return;
    }

    if (this.id) {
      // Update existing request
      this.requestService
        .update(+this.id, this.request)
        .pipe(first())
        .subscribe({
          next: () => {
            this.submitted = false;
            if (this.isModalMode) {
              this.requestSaved.emit();
            } else {
              this.router.navigate(["/requests"]);
            }
          },
          error: (error) => {
            this.submitted = false;
            this.errorMessage = error.error?.message || "An error occurred";
          },
        });
    } else {
      // Create new request
      this.requestService
        .create(this.request)
        .pipe(first())
        .subscribe({
          next: () => {
            this.submitted = false;
            if (this.isModalMode) {
              this.requestSaved.emit();
            } else {
              this.router.navigate(["/requests"]);
            }
          },
          error: (error) => {
            this.submitted = false;
            this.errorMessage = error.error?.message || "An error occurred";
          },
        });
    }
  }

  cancel() {
    if (this.isModalMode) {
      this.cancelled.emit();
    } else {
      this.router.navigate(["/requests"]);
    }
  }
}
