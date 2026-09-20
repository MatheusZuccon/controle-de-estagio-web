import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styleUrl: './login.component.scss',
  template: `
    <main class="login-page">
      <section class="institutional-panel">
        <div class="institutional-brand"><span class="brand-mark" aria-hidden="true"></span><span>FAETERJ Petrópolis</span></div>
        <div class="welcome-content"><div class="graduate-icon" aria-hidden="true"><svg viewBox="0 0 96 96"><path d="M8 36 48 17l40 19-40 19L8 36Z"/><path d="M27 46v18c0 10 42 10 42 0V46"/><path d="M84 38v25"/><circle cx="84" cy="66" r="4"/></svg></div><h1>Olá, bem-vindo!</h1><p>Acesse o Sistema de Gestão de Estágios da FAETERJ Petrópolis.</p></div>
        <p class="institutional-footer">Setor de Estágio · Ambiente acadêmico</p>
      </section>
      <section class="access-panel">
        <form class="login-card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="card-heading"><p class="eyebrow">ACESSO RESTRITO</p><h2>Entrar</h2><p>Informe suas credenciais para continuar.</p></div>
          <label for="email">E-mail institucional</label><input id="email" type="email" formControlName="email" autocomplete="username" placeholder="nome@faeterj-petropolis.edu.br">
          <label for="password">Senha</label><div class="password-field"><input id="password" [type]="showPassword ? 'text' : 'password'" formControlName="password" autocomplete="current-password" placeholder="Digite sua senha"><button type="button" (click)="showPassword = !showPassword" [attr.aria-label]="showPassword ? 'Ocultar senha' : 'Mostrar senha'">{{ showPassword ? 'Ocultar' : 'Mostrar' }}</button></div>
          <p class="error" *ngIf="error">{{ error }}</p>
          <button class="login-button" type="submit" [disabled]="form.invalid">Entrar no sistema</button>
          <div class="demo"><b>Ambiente de demonstração</b><span>Aluno: aluno@faeterj-petropolis.edu.br</span><span>Coordenador: coordenador@faeterj-petropolis.edu.br</span><small>Senha para ambos: Senha@123</small></div>
        </form>
      </section>
    </main>
  `
})
export class LoginComponent {
  showPassword = false;
  error = '';
  form = this.fb.group({ email: ['aluno@faeterj-petropolis.edu.br', [Validators.required, Validators.email]], password: ['Senha@123', Validators.required] });
  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}
  submit(): void { if (this.form.invalid) return; this.error = ''; this.auth.login(this.form.value.email!, this.form.value.password!).subscribe({ next: () => this.router.navigateByUrl('/inicio'), error: response => this.error = response.error?.message || 'Não foi possível entrar. Verifique suas credenciais.' }); }
}
