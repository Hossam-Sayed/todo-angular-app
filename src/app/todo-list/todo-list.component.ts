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

  todos = signal<Todo[] | undefined>(undefined);

  ngOnInit(): void {
    const subscription = this.todosService.getTodos().subscribe({
      next: (todos) =>
        this.todos.set(
          todos.filter((todo) => todo.isCompleted === this.isCompleted())
        ),
      error: (error: Error) => console.log(error),
      complete: () => {},
    });

    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();
    });
  }
}
