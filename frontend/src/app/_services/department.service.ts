import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

const baseUrl = environment.apiUrl ? `${environment.apiUrl}/departments` : '/departments';

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(baseUrl);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${baseUrl}/${id}`);
  }

  create(department: any): Observable<any> {
    return this.http.post<any>(baseUrl, department);
  }

  update(id: number, department: any): Observable<any> {
    return this.http.put<any>(`${baseUrl}/${id}`, department);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${baseUrl}/${id}`);
  }
} 