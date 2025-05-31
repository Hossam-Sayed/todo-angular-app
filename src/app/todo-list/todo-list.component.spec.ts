import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TodoListComponent } from './todo-list.component';
import { TodoComponent } from '../todo/todo.component';
import { TodosService } from '../todo.service';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';
import { Todo } from '../todo/todo.model';

describe('TodoListComponent', () => {
  let fixture: ComponentFixture<TodoListComponent>;
  let component: TodoListComponent;
  let mockTodosService: jasmine.SpyObj<TodosService>;

  const mockTodos: Todo[] = [
    {
      id: '1',
      text: 'Test pending',
      isCompleted: false,
      priority: 'High',
      userId: 'user123',
    },
    {
      id: '2',
      text: 'Completed item',
      isCompleted: true,
      priority: 'Low',
      userId: 'user123',
    },
    {
      id: '3',
      text: 'Test pending 2',
      isCompleted: false,
      priority: 'Medium',
      userId: 'user123',
    },
  ];

  beforeEach(() => {
    mockTodosService = jasmine.createSpyObj('TodosService', [
      'getTodos',
      'updateTodosSignal',
      'todos',
      'searchQuery',
    ]);

    TestBed.configureTestingModule({
      imports: [TodoListComponent],
      providers: [{ provide: TodosService, useValue: mockTodosService }],
    });

    fixture = TestBed.createComponent(TodoListComponent);
    component = fixture.componentInstance;

    // Setup service signals
    mockTodosService.todos.and.returnValue(mockTodos);
    mockTodosService.searchQuery.and.returnValue('');

    mockTodosService.getTodos.and.returnValue(of(mockTodos));
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should display the provided title input', () => {
    fixture.componentRef.setInput('title', 'Pending Todos');
    fixture.componentRef.setInput('isCompleted', false);
    fixture.detectChanges();

    const heading = fixture.nativeElement.querySelector('h4');
    expect(heading.textContent).toContain('Pending Todos');
  });

  it('should render only incomplete todos', () => {
    fixture.componentRef.setInput('title', 'Pending Todos');
    fixture.componentRef.setInput('isCompleted', false);
    fixture.detectChanges();

    const todoComponents = fixture.debugElement.queryAll(
      By.directive(TodoComponent)
    );
    expect(todoComponents.length).toBe(2);
    const texts = todoComponents.map(
      (cmp) => cmp.componentInstance.todo().text
    );
    expect(texts).toContain('Test pending');
    expect(texts).toContain('Test pending 2');
  });

  it('should render only completed todos', () => {
    fixture.componentRef.setInput('title', 'Completed Todos');
    fixture.componentRef.setInput('isCompleted', true);
    fixture.detectChanges();

    const todoComponents = fixture.debugElement.queryAll(
      By.directive(TodoComponent)
    );
    expect(todoComponents.length).toBe(1);
    expect(todoComponents[0].componentInstance.todo().text).toBe(
      'Completed item'
    );
  });

  it('should filter todos based on search query', () => {
    mockTodosService.searchQuery.and.returnValue('pending');
    fixture.componentRef.setInput('title', 'Pending Todos');
    fixture.componentRef.setInput('isCompleted', false);
    fixture.detectChanges();

    const todoComponents = fixture.debugElement.queryAll(
      By.directive(TodoComponent)
    );
    expect(todoComponents.length).toBe(2);
    const texts = todoComponents.map(
      (cmp) => cmp.componentInstance.todo().text
    );
    expect(
      texts.every((text) => text.toLowerCase().includes('pending'))
    ).toBeTrue();
  });

  it('should not render anything if no todos match', () => {
    mockTodosService.searchQuery.and.returnValue('nonexistent');
    fixture.componentRef.setInput('title', 'Empty Todos');
    fixture.componentRef.setInput('isCompleted', false);
    fixture.detectChanges();

    const todoComponents = fixture.debugElement.queryAll(
      By.directive(TodoComponent)
    );
    expect(todoComponents.length).toBe(0);
  });

  it('should fetch todos on init and update signal', () => {
    const spyUpdate = mockTodosService.updateTodosSignal;
    mockTodosService.getTodos.and.returnValue(of(mockTodos));

    fixture.componentRef.setInput('title', 'Todos');
    fixture.componentRef.setInput('isCompleted', false);
    fixture.detectChanges(); // triggers ngOnInit()

    expect(mockTodosService.getTodos).toHaveBeenCalled();
    expect(spyUpdate).toHaveBeenCalledWith(jasmine.any(Function));
  });

  it('should handle error on getTodos', () => {
    spyOn(console, 'log');
    mockTodosService.getTodos.and.returnValue(
      throwError(() => new Error('Fetch failed'))
    );

    fixture.componentRef.setInput('title', 'Todos');
    fixture.componentRef.setInput('isCompleted', false);
    fixture.detectChanges();

    expect(console.log).toHaveBeenCalledWith(new Error('Fetch failed'));
  });
});
