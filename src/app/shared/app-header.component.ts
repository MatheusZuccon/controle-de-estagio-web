import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatMenuModule],
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
      <button type="button" class="account-trigger" [matMenuTriggerFor]="accountMenu" aria-label="Abrir menu da conta">
        <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="9" r="3"/><path d="M6.7 18.8c.7-2.6 2.6-4.2 5.3-4.2s4.6 1.6 5.3 4.2"/></svg>
        <span>{{ auth.isCoordinator ? 'Coordenador' : 'Aluno' }}</span>
      </button>
      <mat-menu #accountMenu="matMenu" xPosition="before" class="account-menu">
        <button mat-menu-item type="button" (click)="auth.logout()">Sair</button>
      </mat-menu>
    </header>
  `,
})
export class AppHeaderComponent {
  constructor(public auth: AuthService) {}
}
