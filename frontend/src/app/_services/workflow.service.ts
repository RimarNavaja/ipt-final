import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

const baseUrl = `${environment.apiUrl}/workflows`;

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  constructor(private http: HttpClient) {}

  getByEmployeeId(employeeId: number): Observable<any[]> {
    return this.http.get<any[]>(`${baseUrl}/employee/${employeeId}`);
  }

  create(workflow: any): Observable<any> {
    return this.http.post<any>(baseUrl, workflow);
  }
} 