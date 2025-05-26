import { Component, DestroyRef, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TodosService } from '../todo.service';
import { Todo, TodoPriority } from '../todo/todo.model';

@Component({
  selector: 'app-new-todo',
  imports: [ReactiveFormsModule],
  templateUrl: './new-todo.component.html',
  styleUrl: './new-todo.component.css',
})
export class NewTodoComponent {
  todosService = inject(TodosService);
  private destroyRef = inject(DestroyRef);

  form = new FormGroup({
    text: new FormControl('', {
      validators: [Validators.required],
    }),
    priority: new FormControl<TodoPriority>('Medium', {
      validators: [Validators.required],
    }),
  });

  onSubmit() {
    const tempId = 'temp-' + Math.random().toString();
    const newTodo: Todo = {
      id: tempId,
      text: this.form.controls.text.value!,
      priority: this.form.controls.priority.value!,
      isCompleted: false,
    };

    const subscription = this.todosService
      .withOptimisticUpdate({
        optimisticUpdate: () =>
          this.todosService.updateTodosSignal((prev) => [...prev, newTodo]),

        rollback: () =>
          this.todosService.updateTodosSignal((prev) =>
            prev.filter((t) => t.id !== tempId)
          ),

        request: () =>
          this.todosService.addTodo({
            text: newTodo.text,
            priority: newTodo.priority,
          }),
      })
      .subscribe({
        next: (res: any) => {
          const realId = res.name.split('/').pop();
          this.todosService.updateTodosSignal((prev) =>
            prev.map((t) => (t.id === tempId ? { ...t, id: realId! } : t))
          );
        },
      });

    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();
    });

    this.form.reset({ text: '', priority: 'Medium' });
  }
}
