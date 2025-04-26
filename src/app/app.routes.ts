import { Routes } from '@angular/router';
import { SignUpComponent } from './components/auth/sign-up/sign-up.component';
import { LoginComponent } from './components/auth/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AuthGuard } from './guards/auth/auth.guard';
import { CreateTimerComponent } from './components/timer/create-timer/create-timer.component';
import { TimersComponent } from './components/timer/timers/timers.component';
import { TimerScreenComponent } from './components/timer/timer-screen/timer-screen.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'auth/signup', component: SignUpComponent },
  { path: 'auth/login', component: LoginComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'timers',
    component: TimersComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'create-timer',
    component: CreateTimerComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'timer-screen/:id',
    component: TimerScreenComponent,
    canActivate: [AuthGuard],
  },
];
