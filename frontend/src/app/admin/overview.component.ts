import { Component } from '@angular/core';

@Component({ templateUrl: 'overview.component.html' })
export class OverviewComponent {
    clearAccountsData() {
        if (confirm('WARNING: This will delete all accounts data. Continue?')) {
            // Remove accounts data
            localStorage.removeItem('angular-18-signup-verification-boilerplate-accounts');
            
            // Remove related data
            localStorage.removeItem('employees');
            localStorage.removeItem('departments');
            localStorage.removeItem('workflows');
            localStorage.removeItem('requests');
            
            // Reload the page to apply changes
            window.location.reload();
        }
    }
}