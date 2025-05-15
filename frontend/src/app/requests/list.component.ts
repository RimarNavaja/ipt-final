import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AccountService, RequestService } from '@app/_services';
import { first } from 'rxjs/operators';

@Component({
  templateUrl: './list.component.html'
})
export class ListComponent implements OnInit {
  requests = [];
  employeeId?: number;

  constructor(
    private requestService: RequestService,
    private accountService: AccountService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Check if viewing requests for a specific employee
    this.employeeId = +this.route.snapshot.params['id'];
    this.loadRequests();
  }

  account() {
    return this.accountService.accountValue;
  }

  loadRequests() {
    this.requestService.getAll()
      .pipe(first())
      .subscribe(requests => {
        // If employeeId is provided, filter requests for that employee
        if (this.employeeId) {
          this.requests = requests.filter(req => req.employeeId === this.employeeId);
        } else {
          this.requests = requests;
        }
      });
  }

  add() {
    this.router.navigate(['requests/add']);
  }

  edit(id: number) {
    this.router.navigate(['requests/edit', id]);
  }

  delete(id: number) {
    if (confirm('Are you sure you want to delete this request?')) {
      this.requestService.delete(id)
        .pipe(first())
        .subscribe(() => {
          this.loadRequests();
        });
    }
  }
} 