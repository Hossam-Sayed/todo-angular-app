import { Component } from '@angular/core';
import { SearchComponent } from '../search/search.component';
import { TodoListComponent } from '../todo-list/todo-list.component';

@Component({
  selector: 'app-dashboard',
  imports: [SearchComponent, TodoListComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {}
