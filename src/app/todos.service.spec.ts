import { TestBed } from '@angular/core/testing';
import { TodosService } from './todo.service';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { AuthService } from './auth/auth.service';
import { BehaviorSubject, throwError } from 'rxjs';
import { TodoPriority, Todo } from './todo/todo.model';
import { User } from './auth/user.model';
import { provideHttpClient } from '@angular/common/http';

class MockAuthService {
  user = new BehaviorSubject<User | null>(
    new User('test@example.com', 'user123', 'fake-token', new Date())
  );
}

describe('TodosService', () => {
  let service: TodosService;
  let httpMock: HttpTestingController;
  let authService: MockAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TodosService,
        { provide: AuthService, useClass: MockAuthService },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(TodosService);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch todos for authenticated user', () => {
    const mockResponse = [
      {
        document: {
          name: 'projects/todoapp-6b203/databases/(default)/documents/todos/todo1',
          fields: {
            text: { stringValue: 'Test Todo' },
            priority: { stringValue: 'High' },
            isCompleted: { booleanValue: false },
            userId: { stringValue: 'user123' },
          },
        },
      },
    ];

    service.getTodos().subscribe((todos) => {
      expect(todos.length).toBe(1);
      expect(todos[0].text).toBe('Test Todo');
    });

    const req = httpMock.expectOne((r) => r.url.includes(':runQuery'));
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should return error if user not authenticated during getTodos', (done) => {
    authService.user.next(null);

    service.getTodos().subscribe({
      next: () => fail('Expected error, got success'),
      error: (err) => {
        expect(err.message).toBe('Failed to fetch Todos');
        done();
      },
    });
  });

  it('should add a new todo for authenticated user', () => {
    const todoData = { text: 'New Task', priority: 'Low' as TodoPriority };
    const mockResponse = { name: 'projects/.../documents/todos/todo123' };

    service.addTodo(todoData).subscribe((res: any) => {
      expect(res.name).toContain('todo123');
    });

    const req = httpMock.expectOne(
      (r) =>
        r.url ===
        'https://firestore.googleapis.com/v1/projects/todoapp-6b203/databases/(default)/documents/todos/'
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body.fields.text.stringValue).toBe(todoData.text);
    req.flush(mockResponse);
  });

  it('should return error if user not authenticated during addTodo', (done) => {
    authService.user.next(null);

    service.addTodo({ text: 'fail', priority: 'High' }).subscribe({
      next: () => fail('Expected error, got success'),
      error: (err) => {
        expect(err.message).toBe('Failed to add Todo');
        done();
      },
    });
  });

  it('should update isCompleted status of a todo', () => {
    const todo: Todo = {
      id: 'todo123',
      text: 'Test',
      isCompleted: true,
      priority: 'Low',
      userId: 'user123',
    };

    service.updateTodo(todo).subscribe();

    const req = httpMock.expectOne(
      'https://firestore.googleapis.com/v1/projects/todoapp-6b203/databases/(default)/documents/todos/todo123/?updateMask.fieldPaths=isCompleted'
    );
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body.fields.isCompleted.booleanValue).toBe(true);
    req.flush({});
  });

  it('should rollback on optimistic update failure', () => {
    let optimisticCalled = false;
    let rollbackCalled = false;

    const request = () => throwError(() => new Error('fail'));

    service
      .withOptimisticUpdate({
        optimisticUpdate: () => {
          optimisticCalled = true;
        },
        rollback: () => {
          rollbackCalled = true;
        },
        request,
      })
      .subscribe({
        error: (err) => {
          expect(err.message).toBe('fail');
          expect(optimisticCalled).toBeTrue();
          expect(rollbackCalled).toBeTrue();
        },
      });
  });

  it('should update todos signal correctly', () => {
    service.updateTodosSignal(() => [
      {
        id: '1',
        text: 'T1',
        priority: 'Low',
        isCompleted: false,
        userId: 'user123',
      },
    ]);
    expect(service.todos().length).toBe(1);
  });

  it('should update search query signal correctly', () => {
    service.updateSearchQuery('important');
    expect(service.searchQuery()).toBe('important');
  });
});
