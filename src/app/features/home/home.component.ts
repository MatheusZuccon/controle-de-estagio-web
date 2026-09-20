import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { AppHeaderComponent } from '../../shared/app-header.component';

@Component({
  standalone: true,
  imports: [CommonModule, AppHeaderComponent],
  styleUrl: './home.component.scss',
  template: `
    <main class="home-page">
      <app-header></app-header>

      <section class="page-heading">
        <p class="eyebrow">SISTEMA DE GEST&#195;O DE EST&#193;GIOS</p>
        <h1>Selecione um controle</h1>
        <p>Acesse o m&#243;dulo que deseja utilizar.</p>
      </section>

      <nav class="menu-options" aria-label="Controles dispon&#237;veis">

        <button *ngIf="auth.isStudent" type="button" class="menu-item" (click)="router.navigateByUrl('/student-profile')">
          <span class="menu-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m2.5 8.5 9.5-5 9.5 5-9.5 5-9.5-5Z"/><path d="M6 10.4v4.4c3.7 2.8 8.3 2.8 12 0v-4.4M21.5 8.5v6"/></svg></span>
          <span class="menu-content"><strong>Controle de Estagi&#225;rio</strong><small>Cadastre e mantenha seus dados acad&#234;micos e pessoais.</small></span>
          <span class="menu-arrow" aria-hidden="true">&#8594;</span>
        </button>
        <button *ngIf="auth.isCoordinator || auth.profileCompleted" type="button" class="menu-item" (click)="router.navigateByUrl('/tces')">
          <span class="menu-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 2.5h8l4 4v15H6z"/><path d="M14 2.5v4h4M9 11h6M9 14h6M9 17h4"/></svg></span>
          <span class="menu-content"><strong>Controle TCE</strong><small>Cadastre, acompanhe e gerencie os Termos de Compromisso de Est&#225;gio.</small></span>
          <span class="menu-arrow" aria-hidden="true">&#8594;</span>
        </button>

        <button *ngIf="auth.isCoordinator || auth.profileCompleted" type="button" class="menu-item" (click)="router.navigateByUrl('/internship-reports')">
          <span class="menu-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 4H5v17h14V4h-4M9 2h6v4H9z"/><path d="M9 17v-3m3 3v-6m3 6v-4"/></svg></span>
          <span class="menu-content"><strong>Controle Relat&#243;rio de est&#225;gio</strong><small>Cadastre, gere e acompanhe seus relat&#243;rios de atividades.</small></span>
          <span class="menu-arrow" aria-hidden="true">&#8594;</span>
        </button>
      </nav>
    </main>
  `
})
export class HomeComponent {
  constructor(public auth: AuthService, public router: Router) {}
}
