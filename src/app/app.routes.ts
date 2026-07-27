import { Routes } from '@angular/router';
import { Userregistration } from './userregistration/userregistration';
import { Home } from './home/home';
import { Login } from './login/login';
import { authGuard } from './guard/auth-guard';
import { Dashboard } from './dashboard/dashboard';
import { MtnCallRecord } from './mtn-call-record/mtn-call-record';
import { Uploadcall } from './uploadcall/uploadcall';
import { Uploadmomo } from './uploadmomo/uploadmomo';
import { ResetPassword } from './reset-password/reset-password';
import { resetPasswordGuardGuard } from './guard/reset-password-guard-guard';

export const routes: Routes = [
    // 1. PUBLIC ROUTES GO FIRST (No Guards)
    {path:'reset-password', component: ResetPassword, canActivate: [resetPasswordGuardGuard]  },
    {path: 'forgot-password', loadComponent: () =>import('./forgot-password/forgot-password')
      .then(m => m.ForgotPassword)},
    { path: 'login', pathMatch: 'full',  component: Login },
    { path: 'userregistration', component: Userregistration },
    // 2. PROTECTED ROUTES GO MIDDLE (Guarded)
    {path: 'home', pathMatch: 'full',  component: Home, canActivate: [authGuard] },
    {path: 'uploadcdr', component: Uploadcall, canActivate: [authGuard] },
    {path: 'uploadmdr', component: Uploadmomo, canActivate: [authGuard] },
    {path: 'dashboard', 
     component: Dashboard, canActivate: [authGuard]
    },
   
     // 3. FALLBACKS GO LAST
    // {path:'', component: Login},
    {path: '', redirectTo: 'login', pathMatch: 'full'},
    { path: '**', redirectTo: 'login' } // Wildcard must be at the very bottom


];
