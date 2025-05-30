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

// A mock for the AuthService to provide a dummy user
class MockAuthService {
  user = new BehaviorSubject<User | null>(
    new User('test@example.com', 'user123', 'fake-token', new Date())
  );
}

describe('TodosService', () => {
  // Define the variables used during testing
  let service: TodosService;
  let httpMock: HttpTestingController;
  let authService: MockAuthService;

  // Before each test
  beforeEach(() => {
    // Define a test bed
    TestBed.configureTestingModule({
      // provides the TodoService, AutService (replaced with the mocked version), and HttpClient mock
      providers: [
        TodosService,
        { provide: AuthService, useClass: MockAuthService },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    // Injects required parameters for tesing
    service = TestBed.inject(TodosService);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as unknown as MockAuthService;

  });

  // After each test
  afterEach(() => {
    // Verifies that no outstanding requests that are not processed
    httpMock.verify();
  });

  // Test that fetchs Todos successfully for authenticated users
  it('should fetch todos for authenticated user', () => {
    // Define a mock API response
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

    // Call fetchTodos
    service.getTodos().subscribe((todos) => {
      // Expect to get only one Todo (the mock above)
      expect(todos.length).toBe(1);
      // Expect the fetched Todo to have a text of Test Todo
      expect(todos[0].text).toBe('Test Todo');
    });

    // Expect the request URL contains :runQuery
    const req = httpMock.expectOne((r) => r.url.includes(':runQuery'));
    // Expect the request method to be POST
    expect(req.request.method).toBe('POST');
    // Return the mocked response
    req.flush(mockResponse);
  });

  // Test that getTodos returns error for unauthenticated users
  it('should return error if user not authenticated during getTodos', (done) => {
    // Set the user to null (unauthenticated)
    authService.user.next(null);

    // call getTodos and subscribe
    service.getTodos().subscribe({
      // Don't expect a success response
      next: () => fail('Expected error, got success'),
      error: (err) => {
        // Expect an error with message 'Failed to fetch Todos'
        expect(err.message).toBe('Failed to fetch Todos');
        // End test
        done();
      },
    });
  });

  // Test that addTodo successfully adds a Todo for authenticated users
  it('should add a new todo for authenticated user', () => {
    // Mock a Todo data
    const todoData = { text: 'New Task', priority: 'Low' as TodoPriority };
    // Mock a response
    const mockResponse = { name: 'projects/.../documents/todos/todo123' };

    // Call addTodo and subscribe
    service.addTodo(todoData).subscribe((res: any) => {
      // Expect a response with the name of the Todo sent in the request URL
      expect(res.name).toContain('todo123');
    });

    // Expect the URL to be the following
    const req = httpMock.expectOne(
      (r) =>
        r.url ===
        'https://firestore.googleapis.com/v1/projects/todoapp-6b203/databases/(default)/documents/todos/'
    );
    // Expect the request method to be POST
    expect(req.request.method).toBe('POST');
    // Expect the request body to contain the text sent above
    expect(req.request.body.fields.text.stringValue).toBe(todoData.text);
    // Return the mocked response
    req.flush(mockResponse);
  });

  // Test that addTodo returns an error for unauthenticated users
  it('should return error if user not authenticated during addTodo', (done) => {
    // Set the user to null (unauthenticated)
    authService.user.next(null);

    // Call addTodo and subscribe
    service.addTodo({ text: 'fail', priority: 'High' }).subscribe({
      // Don't expect a success response
      next: () => fail('Expected error, got success'),
      error: (err) => {
        // Expect an error with message 'Failed to add Todo'
        expect(err.message).toBe('Failed to add Todo');
        // End test
        done();
      },
    });
  });

  // Test that isComplete is toggled correctly
  it('should update isCompleted status of a todo', () => {
    // Mock a Todo object
    const todo: Todo = {
      id: 'todo123',
      text: 'Test',
      isCompleted: true,
      priority: 'Low',
      userId: 'user123',
    };

    // Call updateTodo and subscribe
    service.updateTodo(todo).subscribe();

    // Expect the request URL to be as follows
    const req = httpMock.expectOne(
      'https://firestore.googleapis.com/v1/projects/todoapp-6b203/databases/(default)/documents/todos/todo123/?updateMask.fieldPaths=isCompleted'
    );
    // Expect the request method to be POST
    expect(req.request.method).toBe('PATCH');
    // Expect the body to contain the proper boolean value (true)
    expect(req.request.body.fields.isCompleted.booleanValue).toBe(true);
    // Return the mocked response and wait for an empty response
    req.flush({});
  });

  // Test that optimistic update rollback mechnism works
  it('should rollback on optimistic update failure', () => {
    // Mock necessary booleans
    let optimisticCalled = false;
    let rollbackCalled = false;

    // Mock the response as error (failed request)
    const request = () => throwError(() => new Error('fail'));

    // call withOptimistic updates with proper parameters and subscribe
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
          // Expect an erro with message fail
          expect(err.message).toBe('fail');
          // Expect both booleans to be true as mocked
          expect(optimisticCalled).toBeTrue();
          expect(rollbackCalled).toBeTrue();
        },
      });
  });

  // Test that updating the Todos signal works
  it('should update todos signal correctly', () => {
    // Call updateTodoSignal with mock data
    service.updateTodosSignal(() => [
      {
        id: '1',
        text: 'T1',
        priority: 'Low',
        isCompleted: false,
        userId: 'user123',
      },
    ]);
    // Expect the Todos signal to carry one Todo
    expect(service.todos().length).toBe(1);
  });

  // Test that the update query signal works
  it('should update search query signal correctly', () => {
    // Call the updateSearchQuery funciton with a keyword
    service.updateSearchQuery('important');
    // Expect the searchQuery to hold the sent search keyword
    expect(service.searchQuery()).toBe('important');
  });
});
