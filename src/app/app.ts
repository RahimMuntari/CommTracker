import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from "./navbar/navbar.component";

@Component({
  selector: 'app-root',
  imports: [Navbar, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  isMenuOpen = false; 
  protected readonly title = signal('CommTracker');

}
