import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';  // Import 'of' for creating an empty Observable
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

interface User {
  username: string;
  profileLink: string;
  articlesCount: number;
  favoritesCount: number;
  firstArticleDate: Date | null;
}

@Component({
  selector: 'app-roster',
  templateUrl: './roster.component.html',
  standalone: true
})
export class RosterComponent implements OnInit {
  users$: Observable<User[]> = of([]);  // Initialize with an empty Observable

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.users$ = this.http.get<User[]>('http://localhost:3000/users/roster').pipe(
      catchError(error => {
        console.error('Failed to fetch users:', error);
        return throwError(() => new Error('Failed to fetch users'));
      })
    );
}
}
