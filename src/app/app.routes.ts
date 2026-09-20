import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { profileCompleteGuard } from './core/profile-complete.guard';
import { pendingChangesGuard } from './core/pending-changes.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
  { path: 'inicio', canActivate: [authGuard], loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
  { path: 'student-profile', canActivate: [authGuard], canDeactivate: [pendingChangesGuard], loadComponent: () => import('./features/student/student-profile.component').then(m => m.StudentProfileComponent) },
  { path: 'tces', canActivate: [authGuard, profileCompleteGuard], loadComponent: () => import('./features/tce/tce-list.component').then(m => m.TceListComponent) },
  { path: 'tces/new', canActivate: [authGuard, profileCompleteGuard], canDeactivate: [pendingChangesGuard], loadComponent: () => import('./features/tce/tce-form.component').then(m => m.TceFormComponent) },
  { path: 'tces/:id/edit', canActivate: [authGuard, profileCompleteGuard], canDeactivate: [pendingChangesGuard], loadComponent: () => import('./features/tce/tce-form.component').then(m => m.TceFormComponent) },
  { path: 'tces/:id', canActivate: [authGuard, profileCompleteGuard], canDeactivate: [pendingChangesGuard], loadComponent: () => import('./features/tce/tce-detail.component').then(m => m.TceDetailComponent) },
  { path: 'internship-reports', canActivate: [authGuard, profileCompleteGuard], loadComponent: () => import('./features/internship-report/internship-report-list.component').then(m => m.InternshipReportListComponent) },
  { path: 'internship-reports/new', canActivate: [authGuard, profileCompleteGuard], canDeactivate: [pendingChangesGuard], loadComponent: () => import('./features/internship-report/internship-report-form.component').then(m => m.InternshipReportFormComponent) },
  { path: 'internship-reports/:id/edit', canActivate: [authGuard, profileCompleteGuard], canDeactivate: [pendingChangesGuard], loadComponent: () => import('./features/internship-report/internship-report-form.component').then(m => m.InternshipReportFormComponent) },
  { path: 'internship-reports/:id', canActivate: [authGuard, profileCompleteGuard], canDeactivate: [pendingChangesGuard], loadComponent: () => import('./features/internship-report/internship-report-detail.component').then(m => m.InternshipReportDetailComponent) },
  { path: '', pathMatch: 'full', redirectTo: 'inicio' },
];
