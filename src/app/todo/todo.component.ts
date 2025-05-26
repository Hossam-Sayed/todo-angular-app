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
    this.todosService.updateTodo(this.todo());
  }
}
