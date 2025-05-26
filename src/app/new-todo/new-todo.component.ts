import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TodosService } from '../todo.service';
import { TodoPriority } from '../todo/todo.model';

@Component({
  selector: 'app-new-todo',
  imports: [ReactiveFormsModule],
  templateUrl: './new-todo.component.html',
  styleUrl: './new-todo.component.css',
})
export class NewTodoComponent {
  todosService = inject(TodosService);

  form = new FormGroup({
    text: new FormControl('', {
      validators: [Validators.required],
    }),
    priority: new FormControl<TodoPriority>('Medium', {
      validators: [Validators.required],
    }),
  });

  onSubmit() {
    console.log(this.form);
    this.todosService.addTodo({
      text: this.form.controls.text.value!,
      priority: this.form.controls.priority.value!,
    });
    this.form.controls.text.reset();
  }
}
