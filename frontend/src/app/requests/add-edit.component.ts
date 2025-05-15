import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AccountService, RequestService } from '@app/_services';
import { first } from 'rxjs/operators';

@Component({
  templateUrl: './add.edit.component.html'
})
export class AddEditComponent implements OnInit {
  id: string;
  request: any = {
    type: 'Equipment',
    requestItems: [{ name: '', quantity: 1 }],
    status: 'Pending'
  };
  errorMessage = '';

  constructor(
    private requestService: RequestService,
    private accountService: AccountService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.id = this.route.snapshot.params['id'];
    
    if (this.id) {
      // Edit mode - fetch request data
      this.requestService.getById(+this.id)
        .pipe(first())
        .subscribe(request => {
          this.request = request;
        });
    }
  }

  addItem() {
    this.request.requestItems.push({ name: '', quantity: 1 });
  }

  removeItem(index: number) {
    this.request.requestItems.splice(index, 1);
  }

  save() {
    // Remove any empty items
    this.request.requestItems = this.request.requestItems.filter(
      item => item.name.trim() !== ''
    );

    if (this.id) {
      // Update existing request
      this.requestService.update(+this.id, this.request)
        .pipe(first())
        .subscribe({
          next: () => {
            this.router.navigate(['requests']);
          },
          error: error => {
            this.errorMessage = error.error?.message || 'An error occurred';
          }
        });
    } else {
      // Create new request
      this.requestService.create(this.request)
        .pipe(first())
        .subscribe({
          next: () => {
            this.router.navigate(['requests']);
          },
          error: error => {
            this.errorMessage = error.error?.message || 'An error occurred';
          }
        });
    }
  }

  cancel() {
    this.router.navigate(['requests']);
  }
} 