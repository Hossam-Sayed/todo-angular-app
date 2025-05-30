import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
  isAuthenticated = false;
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    const subscription = this.authService.user.subscribe((user) => {
      this.isAuthenticated = !!user;
    });

    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();
    });
  }

  onLogout() {
    console.log('logout called');
    this.authService.logout();
  }
}
