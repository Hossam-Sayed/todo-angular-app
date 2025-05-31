import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TodoComponent } from './todo.component';
import { Todo } from './todo.model';
import { TodosService } from '../todo.service';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

class MockTodosService {
  updateTodo = jasmine.createSpy().and.callFake((todo: Todo) => of(todo));
  updateTodosSignal = jasmine.createSpy().and.callFake(() => {});
  withOptimisticUpdate = jasmine
    .createSpy()
    .and.callFake(({ optimisticUpdate, request }) => {
      optimisticUpdate();
      return request();
    });
}

describe('TodoComponent', () => {
  let fixture: ComponentFixture<TodoComponent>;
  let component: TodoComponent;
  let mockService: MockTodosService;

  const mockTodo: Todo = {
    id: '1',
    text: 'Test Task',
    priority: 'High',
    isCompleted: false,
    userId: 'user123',
  };

  beforeEach(async () => {
    mockService = new MockTodosService();

    await TestBed.configureTestingModule({
      imports: [TodoComponent],
      providers: [{ provide: TodosService, useValue: mockService }],
    }).compileComponents();

    fixture = TestBed.createComponent(TodoComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('todo', mockTodo);
    fixture.detectChanges();
  });

  it('should render todo text and priority', () => {
    const textEl = fixture.debugElement.query(
      By.css('span.me-auto')
    ).nativeElement;
    const badgeEl = fixture.debugElement.query(
      By.css('span.badge')
    ).nativeElement;

    expect(textEl.textContent).toContain('Test Task');
    expect(badgeEl.textContent).toContain('High');
    expect(badgeEl.className).toContain('priority-high');
  });

  it('should display "Done" when todo is not completed', () => {
    const button = fixture.debugElement.query(By.css('button')).nativeElement;
    expect(button.textContent).toContain('Done');
  });

  it('should display "Undo" when todo is completed', () => {
    fixture.componentRef.setInput('todo', { ...mockTodo, isCompleted: true });
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('button')).nativeElement;
    expect(button.textContent).toContain('Undo');
  });

  it('should call withOptimisticUpdate and updateTodo on click', () => {
    const button = fixture.debugElement.query(By.css('button')).nativeElement;
    button.click();

    expect(mockService.withOptimisticUpdate).toHaveBeenCalled();
    expect(mockService.updateTodo).toHaveBeenCalledWith({
      ...mockTodo,
      isCompleted: true,
    });
  });

  it('should trigger rollback on update error', () => {
    let didRollback = false;
    mockService.withOptimisticUpdate = jasmine
      .createSpy()
      .and.callFake(({ optimisticUpdate }) => {
        optimisticUpdate();
        didRollback = true;
        return throwError(() => new Error('Failed'));
      });

    const button = fixture.debugElement.query(By.css('button')).nativeElement;
    button.click();

    expect(didRollback).toBeTrue();
  });

  it('should unsubscribe on destroy', () => {
    const unsubscribeSpy = jasmine.createSpy('unsubscribe');
    mockService.withOptimisticUpdate = jasmine.createSpy().and.returnValue({
      subscribe: () => ({
        unsubscribe: unsubscribeSpy,
      }),
    });

    component.onClick();
    fixture.destroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
  });
});
