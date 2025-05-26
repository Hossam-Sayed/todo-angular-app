import { Component, computed, inject, input } from '@angular/core';
import { Todo } from './todo.model';
import { CommonModule } from '@angular/common';
import { TodosService } from '../todo.service';

@Component({
  selector: 'app-todo',
  imports: [CommonModule],
  templateUrl: './todo.component.html',
  styleUrl: './todo.component.css',
})
export class TodoComponent {
  todo = input.required<Todo>();
  todosService = inject(TodosService);
  status = computed(() => (this.todo().isCompleted ? 'Undo' : 'Done'));

  onClick() {
    const todo = this.todo();
    const updatedIsCompleted = !todo.isCompleted;

    this.todosService
      .withOptimisticUpdate({
        optimisticUpdate: () =>
          this.todosService.updateTodosSignal((prev) =>
            prev.map((t) =>
              t.id === todo.id ? { ...t, isCompleted: updatedIsCompleted } : t
            )
          ),

        rollback: () =>
          this.todosService.updateTodosSignal((prev) =>
            prev.map((t) =>
              t.id === todo.id ? { ...t, isCompleted: todo.isCompleted } : t
            )
          ),

        request: () => this.todosService.updateTodo(todo),
      })
      .subscribe({
        error: () => {
          // Show an error notification/toast
        },
      });
  }
}
