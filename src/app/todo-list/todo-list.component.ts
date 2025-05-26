import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { TodoComponent } from '../todo/todo.component';
import { TodosService } from '../todo.service';
import { Todo } from '../todo/todo.model';

@Component({
  selector: 'app-todo-list',
  imports: [TodoComponent],
  templateUrl: './todo-list.component.html',
  styleUrl: './todo-list.component.css',
})
export class TodoListComponent implements OnInit {
  title = input.required<string>();
  isCompleted = input.required<boolean>();
  private todosService = inject(TodosService);
  private destroyRef = inject(DestroyRef);

  filteredTodos = computed(() => {
    const todos = this.todosService.todos();
    const search = this.todosService.searchQuery();
    return todos.filter(
      (t) =>
        t.isCompleted === this.isCompleted() &&
        t.text.toLowerCase().includes(search)
    );
  });

  ngOnInit(): void {
    const subscription = this.todosService.getTodos().subscribe({
      next: (todos) => this.todosService.updateTodosSignal(() => todos),
      error: (error: Error) => console.log(error),
      complete: () => {},
    });

    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();
    });
  }
}
