import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AccountService, WorkflowService } from '@app/_services';
import { first } from 'rxjs/operators';

@Component({
  templateUrl: './list.components.html'
})
export class ListComponent implements OnInit {
  employeeId: number;
  workflows = [];

  constructor(
    private workflowService: WorkflowService,
    private accountService: AccountService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.employeeId = +this.route.snapshot.params['id'];
    this.loadWorkflows();
  }

  account() {
    return this.accountService.accountValue;
  }

  loadWorkflows() {
    this.workflowService.getByEmployeeId(this.employeeId)
      .pipe(first())
      .subscribe(workflows => {
        this.workflows = workflows;
      });
  }

  updateStatus(workflow: any) {
    // Create a new workflow with updated status
    const updatedWorkflow = {
      ...workflow,
      status: workflow.status
    };
    
    this.workflowService.create(updatedWorkflow)
      .pipe(first())
      .subscribe(() => {
        this.loadWorkflows();
      });
  }
} 