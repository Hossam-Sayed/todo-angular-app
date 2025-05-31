import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { NewTodoComponent } from './new-todo.component';
import { ReactiveFormsModule } from '@angular/forms';
import { TodosService } from '../todo.service';
import { Location } from '@angular/common';

describe('NewTodoComponent', () => {
  let fixture: ComponentFixture<NewTodoComponent>;
  let component: NewTodoComponent;

  const mockTodosService = {
    withOptimisticUpdate: jasmine.createSpy('withOptimisticUpdate'),
    updateTodosSignal: jasmine.createSpy('updateTodosSignal'),
    addTodo: jasmine.createSpy('addTodo'),
  };

  const mockLocation = {
    back: jasmine.createSpy('back'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, NewTodoComponent],
      providers: [
        { provide: TodosService, useValue: mockTodosService },
        { provide: Location, useValue: mockLocation },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NewTodoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should disable submit button if form is invalid', () => {
    component.form.controls.text.setValue('');
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(button.disabled).toBeTrue();
  });

  it('should enable submit button if form is valid', () => {
    component.form.controls.text.setValue('Test Todo');
    component.form.controls.priority.setValue('High');
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(button.disabled).toBeFalse();
  });

  it('should call TodosService.withOptimisticUpdate on valid submit', () => {
    const fakeObservable = of({ name: 'todos/abc123' });
    mockTodosService.withOptimisticUpdate.and.returnValue(fakeObservable);

    component.form.controls.text.setValue('New task');
    component.form.controls.priority.setValue('Medium');
    fixture.detectChanges();

    component.onSubmit();

    expect(mockTodosService.withOptimisticUpdate).toHaveBeenCalled();
    expect(mockLocation.back).toHaveBeenCalled();
  });

  it('should reset form after successful submission', () => {
    const fakeObservable = of({ name: 'todos/new-id' });
    mockTodosService.withOptimisticUpdate.and.returnValue(fakeObservable);

    component.form.controls.text.setValue('Test reset');
    component.form.controls.priority.setValue('High');
    fixture.detectChanges();

    component.onSubmit();
    expect(component.form.value).toEqual({ text: '', priority: 'Medium' });
  });
});
