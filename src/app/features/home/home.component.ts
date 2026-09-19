import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  styleUrl: './home.component.scss',
  template: `
    <main class="home-page">
      <header class="app-header">
        <div class="brand"><b>FT</b><span>FAETERJ Petr&#243;polis &#8212; Sistema de Gest&#227;o de Est&#225;gios</span></div>
        <button type="button" class="exit" (click)="auth.logout()">Sair</button>
      </header>

      <section class="page-heading">
        <p class="eyebrow">SISTEMA DE GEST&#195;O DE EST&#193;GIOS</p>
        <h1>Selecione um controle</h1>
        <p>Acesse o m&#243;dulo que deseja utilizar.</p>
      </section>

      <nav class="menu-options" aria-label="Controles dispon&#237;veis">

        <button *ngIf="auth.isStudent" type="button" class="menu-item" (click)="router.navigateByUrl('/student-profile')">
          <span class="menu-icon" aria-hidden="true">ES</span>
          <span class="menu-content"><strong>Controle de Estagi&#225;rio</strong><small>Cadastre e mantenha seus dados acad&#234;micos e pessoais.</small></span>
          <span class="menu-arrow" aria-hidden="true">&#8594;</span>
        </button>
        <button *ngIf="auth.isCoordinator || auth.profileCompleted" type="button" class="menu-item" (click)="router.navigateByUrl('/tces')">
          <span class="menu-icon" aria-hidden="true">TCE</span>
          <span class="menu-content"><strong>Controle TCE</strong><small>Cadastre, acompanhe e gerencie os Termos de Compromisso de Est&#225;gio.</small></span>
          <span class="menu-arrow" aria-hidden="true">&#8594;</span>
        </button>

        <article *ngIf="reportAvailable()" class="menu-item unavailable" aria-label="Controle Relat&#243;rio de est&#225;gio, em breve">
          <span class="menu-icon" aria-hidden="true">RE</span>
          <span class="menu-content"><strong>Controle Relat&#243;rio de est&#225;gio</strong><small>Este m&#243;dulo estar&#225; dispon&#237;vel em breve.</small></span>
          <span class="status">Em breve</span>
        </article>
      </nav>
    </main>
  `
})
export class HomeComponent implements OnInit {
  reportAvailable = signal(false);
  constructor(public auth: AuthService, public router: Router, private http: HttpClient) {}
  ngOnInit(): void {
    if (!this.auth.isStudent || !this.auth.profileCompleted) return;
    const params = new HttpParams().set('status', 'APROVADO').set('pageSize', 1);
    this.http.get<any>(`${this.auth.api}/tces`, { params }).subscribe({ next: result => this.reportAvailable.set(result.total > 0) });
  }
}
