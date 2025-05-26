import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NewTodoComponent } from "./new-todo/new-todo.component";
import { SearchComponent } from "./search/search.component";
import { TodoListComponent } from "./todo-list/todo-list.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NewTodoComponent, SearchComponent, TodoListComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'todo-app';
}
