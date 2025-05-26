import { inject, Injectable, signal } from '@angular/core';
import { TodoPriority, Todo } from './todo/todo.model';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TodosService {
  private BASE_URL = 'https://firestore.googleapis.com/v1/projects';
  private PROJECT_ID = 'todoapp-6b203';
  private API_URL = `${this.BASE_URL}/${this.PROJECT_ID}/databases/(default)/documents/todos/`;

  httpClient = inject(HttpClient);
  private _todos = signal<Todo[]>([]);
  readonly todos = this._todos.asReadonly();

  searchQuery = signal<string>('');

  updateTodosSignal(updater: (prev: Todo[]) => Todo[]) {
    this._todos.update(updater);
  }

  updateSearchQuery(query: string) {
    this.searchQuery.set(query);
  }

  getTodos() {
    return this.httpClient.get<{ documents: any[] }>(this.API_URL).pipe(
      map(
        (resData) => resData.documents?.map(this.mapFirestoreDocToTodo) ?? []
      ),
      catchError((error) => {
        console.log(error);
        return throwError(() => new Error('Failed to fetch Todos'));
      })
    );
  }

  addTodo(todoData: { text: string; priority: TodoPriority }) {
    const body = {
      fields: {
        text: { stringValue: todoData.text },
        priority: { stringValue: todoData.priority },
        isCompleted: { booleanValue: false },
      },
    };

    return this.httpClient.post(this.API_URL, body).pipe(
      catchError((error) => {
        console.error('Error adding todo:', error);
        return throwError(() => new Error('Failed to add Todo'));
      })
    );
  }

  updateTodo(todo: Todo) {
    const updatedIsCompleted = !todo.isCompleted;

    const url = `${this.API_URL}${todo.id}?updateMask.fieldPaths=isCompleted`;

    const body = {
      fields: {
        isCompleted: { booleanValue: updatedIsCompleted },
      },
    };

    return this.httpClient.patch(url, body).pipe(
      catchError((error) => {
        console.error('Failed to update todo:', error);
        return throwError(() => new Error('Failed to update todo'));
      })
    );
  }

  private mapFirestoreDocToTodo(doc: any): Todo {
    const fields = doc.fields;
    return {
      id: doc.name.split('/').pop(), // Firestore doc ID
      text: fields.text.stringValue,
      priority: fields.priority.stringValue as TodoPriority,
      isCompleted: fields.isCompleted.booleanValue,
    };
  }

  withOptimisticUpdate<T>({
    optimisticUpdate,
    rollback,
    request,
  }: {
    optimisticUpdate: () => void;
    rollback: () => void;
    request: () => Observable<T>;
  }): Observable<T> {
    optimisticUpdate();

    return request().pipe(
      catchError((error) => {
        rollback();
        return throwError(() => error);
      })
    );
  }
}
