import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  styleUrl: './app-header.component.scss',
  template: `
    <header>
      <a class="brand" routerLink="/inicio" aria-label="Ir para o início">
        <span class="brand-logo" aria-hidden="true"></span>
        <span class="brand-name">FAETERJ Petrópolis — Sistema de Gestão de Estágios</span>
      </a>
      <nav aria-label="Navegação principal">
        <a *ngIf="auth.isStudent" routerLink="/student-profile" routerLinkActive="active">Meu cadastro</a>
        <a routerLink="/tces" routerLinkActive="active">TCE</a>
        <a routerLink="/internship-reports" routerLinkActive="active">Relatórios</a>
      </nav>
      <button type="button" class="exit" (click)="auth.logout()">Sair</button>
    </header>
  `,
})
export class AppHeaderComponent {
  constructor(public auth: AuthService) {}
}
