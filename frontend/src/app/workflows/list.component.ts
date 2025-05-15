import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountService, WorkflowService, EmployeeService } from '@app/_services';
import { first } from 'rxjs/operators';

@Component({
  templateUrl: './list.components.html'
})
export class ListComponent implements OnInit {
  employeeId: number;
  workflows = [];
  employee: any = {};
  loading = true;

  constructor(
    private workflowService: WorkflowService,
    private accountService: AccountService,
    private employeeService: EmployeeService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.employeeId = +this.route.snapshot.params['id'];
    this.loadData();
  }

  account() {
    return this.accountService.accountValue;
  }

  loadData() {
    this.loading = true;
    
    // First load employee data
    this.employeeService.getById(this.employeeId)
      .pipe(first())
      .subscribe({
        next: employee => {
          this.employee = employee;
          // Then load workflows
          this.loadWorkflows();
        },
        error: error => {
          console.error('Error loading employee:', error);
          this.loading = false;
        }
      });
  }

  loadWorkflows() {
    this.workflowService.getByEmployeeId(this.employeeId)
      .pipe(first())
      .subscribe({
        next: workflows => {
          this.workflows = workflows;
          this.loading = false;
        },
        error: error => {
          console.error('Error loading workflows:', error);
          this.loading = false;
        }
      });
  }

  updateStatus(workflow: any) {
    // Use the update method with the workflow ID
    this.workflowService.update(workflow.id, workflow)
      .pipe(first())
      .subscribe({
        next: () => {
          // When the workflow is approved or rejected, it will be removed from the list
          if (workflow.status === 'Approved' || workflow.status === 'Rejected') {
            // Reload the data to reflect the changes
            this.loadWorkflows();
            
            // If the workflow was for a department transfer and was approved, 
            // we need to refresh the employee data as well
            if (workflow.type === 'Department Transfer' && workflow.status === 'Approved') {
              this.employeeService.getById(this.employeeId)
                .pipe(first())
                .subscribe(employee => {
                  this.employee = employee;
                });
            }
          }
        },
        error: error => {
          console.error('Error updating workflow status:', error);
          // Reset the workflow status in case of error
          this.loadWorkflows();
        }
      });
  }

  goBack() {
    this.router.navigate(['employees']);
  }
} 