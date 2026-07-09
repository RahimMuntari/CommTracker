import { Routes } from '@angular/router';
import { Userregistration } from './userregistration/userregistration';
import { Home } from './home/home';
import { Login } from './login/login';
import { authGuard } from './guard/auth-guard';
import { Dashboard } from './dashboard/dashboard';
import { MtnCallRecord } from './mtn-call-record/mtn-call-record';
import { Uploadcall } from './uploadcall/uploadcall';
import { Uploadmomo } from './uploadmomo/uploadmomo';

export const routes: Routes = [
    {path:'', component: Login},
    { path: 'login', pathMatch: 'full',  component: Login },
    {path: '', redirectTo: 'login', pathMatch: 'full'},
    { path: 'home', pathMatch: 'full',  component: Home, canActivate: [authGuard] },
    {path: 'uploadcdr', component: Uploadcall, canActivate: [authGuard] },
    {path: 'uploadmdr', component: Uploadmomo, canActivate: [authGuard] },
    {path: 'dashboard', 
     component: Dashboard, canActivate: [authGuard]
      
    },
  
 
    // {path: '', pathMatch: 'full', loadComponent: () => import('./login/login').then(m => m.Login)},
 
    { path: 'userregistration', component: Userregistration },
   
    {
  path: 'forgot-password',
  loadComponent: () =>
    import('./forgot-password/forgot-password')
      .then(m => m.ForgotPassword)
}


];
