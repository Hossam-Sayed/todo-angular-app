import { inject, Injectable, signal } from '@angular/core';
import { TodoPriority, Todo } from './todo/todo.model';
import { HttpClient } from '@angular/common/http';
import { catchError, map, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TodosService {
  private BASE_URL = 'https://firestore.googleapis.com/v1/projects';
  private PROJECT_ID = 'todoapp-6b203';
  private API_URL = `${this.BASE_URL}/${this.PROJECT_ID}/databases/(default)/documents/todos/`;

  httpClient = inject(HttpClient);
  private todos = signal<Todo[]>([]);

  getTodos() {
    return this.httpClient.get<{ todos: Todo[] }>(this.API_URL).pipe(
      map((resData) => resData.todos),
      catchError((error) => {
        console.log(error);
        return throwError(() => new Error('Failed to fetch Todos'));
      })
    );
  }

  addTodo(todoData: { text: string; priority: TodoPriority }) {
    const todo: Todo = {
      id: Math.random().toString(),
      text: todoData.text,
      priority: todoData.priority,
      isCompleted: false,
    };
    console.log(todo);
    this.todos.update((oldTodos) => [...oldTodos, todo]);
    return this.httpClient.post(this.API_URL, todo);
  }

  updateTodo(todo: Todo) {
    this.todos.update((todos) =>
      todos.map((t) =>
        t.id === todo.id
          ? {
              ...t,
              isCompleted: !t.isCompleted,
            }
          : t
      )
    );
  }
}
