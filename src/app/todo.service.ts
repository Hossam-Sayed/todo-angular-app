import { inject, Injectable, signal } from '@angular/core';
import { TodoPriority, Todo } from './todo/todo.model';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  catchError,
  exhaustMap,
  map,
  Observable,
  take,
  throwError,
} from 'rxjs';
import { AuthService } from './auth/auth.service';

@Injectable({ providedIn: 'root' })
export class TodosService {
  private BASE_URL = 'https://firestore.googleapis.com/v1/projects';
  private PROJECT_ID = 'todoapp-6b203';
  private API_URL = `${this.BASE_URL}/${this.PROJECT_ID}/databases/(default)/documents/todos/`;

  private httpClient = inject(HttpClient);
  private authService = inject(AuthService);

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
    return this.authService.user.pipe(
      take(1),
      exhaustMap((user) => {
        if (!user) throw new Error('User not authenticated');

        const structuredQuery = {
          structuredQuery: {
            from: [{ collectionId: 'todos' }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'userId' },
                op: 'EQUAL',
                value: { stringValue: user.id },
              },
            },
          },
        };

        const queryUrl = `${this.BASE_URL}/${this.PROJECT_ID}/databases/(default)/documents:runQuery`;

        return this.httpClient
          .post<any[]>(queryUrl, structuredQuery)
          .pipe(
            map((resData) =>
              resData
                .filter((item) => item.document)
                .map((item) => this.mapFirestoreDocToTodo(item.document))
            )
          );
      }),
      catchError((error) => {
        console.error('Error fetching todos:', error);
        return throwError(() => new Error('Failed to fetch Todos'));
      })
    );
  }

  addTodo(todoData: { text: string; priority: TodoPriority }) {
    return this.authService.user.pipe(
      take(1),
      exhaustMap((user) => {
        if (!user) throw new Error('User not authenticated');

        const body = {
          fields: {
            text: { stringValue: todoData.text },
            priority: { stringValue: todoData.priority },
            isCompleted: { booleanValue: false },
            userId: { stringValue: user.id },
          },
        };

        return this.httpClient.post(this.API_URL, body);
      }),
      catchError((error) => {
        console.error('Error adding todo:', error);
        return throwError(() => new Error('Failed to add Todo'));
      })
    );
  }

  updateTodo(todo: Todo) {
    const url = `${this.API_URL}${todo.id}/?updateMask.fieldPaths=isCompleted`;

    console.log(todo);

    const body = {
      fields: {
        isCompleted: { booleanValue: todo.isCompleted },
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
      id: doc.name.split('/').pop(),
      text: fields.text.stringValue,
      priority: fields.priority.stringValue as TodoPriority,
      isCompleted: fields.isCompleted.booleanValue,
      userId: fields.userId.stringValue,
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
