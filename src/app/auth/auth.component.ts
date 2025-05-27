import { Component, DestroyRef, inject } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { AuthService } from './auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
})
export class AuthComponent {
  isLoginMode = false;
  error: string = '';
  authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  form = new FormGroup({
    email: new FormControl('', {
      validators: [Validators.required],
    }),
    password: new FormControl('', {
      validators: [Validators.required, Validators.minLength(6)],
    }),
  });

  onSwitchMode() {
    this.isLoginMode = !this.isLoginMode;
  }

  onSubmit() {
    if (this.form.invalid) return;
    console.log(this.form.controls.email.value);
    console.log(this.form.controls.password.value);

    const email = this.form.controls.email.value!;
    const password = this.form.controls.password.value!;

    if (this.isLoginMode) {
      // Subscribe on login response
    } else {
      const subscription = this.authService.signUp(email, password).subscribe({
        next: (resData) => console.log(resData),
        error: (error: Error) => {
          console.log(error);
          this.error = error.message;
        },
        complete: () => {},
      });

      this.destroyRef.onDestroy(() => {
        subscription.unsubscribe();
      });
    }

    this.form.reset();
  }
}
