import { Routes } from '@angular/router';
import { Userregistration } from './userregistration/userregistration';
import { Home } from './home/home';
import { Login } from './login/login';

export const routes: Routes = [
    {path:'login', component: Login},
    {path: '', pathMatch: 'full', loadComponent: () => import('./login/login').then(m => m.Login)},
    // {path: '', redirectTo: 'home', pathMatch: 'full'},
    { path: 'home', component: Home },
    { path: 'userregistration', component: Userregistration },
    {path: 'dashboard', loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard)},
    {
  path: 'forgot-password',
  loadComponent: () =>
    import('./forgot-password/forgot-password')
      .then(m => m.ForgotPassword)
}


];
