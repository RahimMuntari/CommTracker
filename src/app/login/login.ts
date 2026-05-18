import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  constructor(private router: Router) {}

  email = signal('');
  password = signal('');
  loading = signal(false);

  login() {
    this.loading.set(true);

    setTimeout(() => {
      this.loading.set(false);
      this.router.navigate(['/dashboard']);
    }, 1200);
  }
}
