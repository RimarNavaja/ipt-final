import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

const baseUrl = environment.apiUrl ? `${environment.apiUrl}/workflows` : '/workflows';

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  constructor(private http: HttpClient) {}

  getByEmployeeId(employeeId: number): Observable<any[]> {
    return this.http.get<any[]>(`${baseUrl}/employee/${employeeId}`);
  }

  create(workflow: any): Observable<any> {
    return this.http.post<any>(baseUrl, workflow);
  }
  
  update(id: number, workflow: any): Observable<any> {
    return this.http.put<any>(`${baseUrl}/${id}`, workflow);
  }
  
  updateStatus(id: number, status: string): Observable<any> {
    return this.http.put<any>(`${baseUrl}/${id}/status`, { status });
  }
} 