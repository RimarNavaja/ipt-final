import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

const baseUrl = environment.apiUrl ? `${environment.apiUrl}/requests` : '/requests';

@Injectable({ providedIn: 'root' })
export class RequestService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(baseUrl);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${baseUrl}/${id}`);
  }

  create(request: any): Observable<any> {
    return this.http.post<any>(baseUrl, request);
  }

  update(id: number, request: any): Observable<any> {
    return this.http.put<any>(`${baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${baseUrl}/${id}`);
  }
} 