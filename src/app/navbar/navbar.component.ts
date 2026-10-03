import { Component, inject } from '@angular/core';
import { RouterLink } from "@angular/router";
import { LogInService } from '../services/log-in-service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl:'./navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class Navbar {

  loginService = inject(LogInService);  

  isMenuOpen = false;
  isDarkMode = false;

  constructor() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDarkMode = true;
    } else if (savedTheme === 'light') {
      this.isDarkMode = false;
    } else {
      this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    this.applyTheme();
  }


  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  applyTheme() {
    const html = document.documentElement;

    if (this.isDarkMode) {
      html.classList.add('dark');
      html.style.colorScheme = 'dark';
    } else {
      html.classList.remove('dark');
      html.style.colorScheme = 'light';
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    
  }
}
