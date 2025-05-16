import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "@environments/environment";

const baseUrl = environment.apiUrl
  ? `${environment.apiUrl}/employees`
  : `/employees`;

@Injectable({ providedIn: "root" })
export class EmployeeService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(baseUrl);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${baseUrl}/${id}`);
  }

  create(employee: any): Observable<any> {
    return this.http.post<any>(baseUrl, employee);
  }

  update(id: number, employee: any): Observable<any> {
    return this.http.put<any>(`${baseUrl}/${id}`, employee);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${baseUrl}/${id}`);
  }

  transfer(id: number, departmentName: string): Observable<any> {
    return this.http.post<any>(`${baseUrl}/${id}/transfer`, {
      newDepartment: departmentName,
    });
  }
}
