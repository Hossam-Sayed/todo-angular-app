import { Component } from '@angular/core';
import { NewTodoComponent } from '../new-todo/new-todo.component';
import { SearchComponent } from '../search/search.component';
import { TodoListComponent } from '../todo-list/todo-list.component';

@Component({
  selector: 'app-dashboard',
  imports: [NewTodoComponent, SearchComponent, TodoListComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {}
