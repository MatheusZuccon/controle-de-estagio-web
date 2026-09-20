import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, HostListener, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { AppHeaderComponent } from '../../shared/app-header.component';

type InternshipReport = {
  id: string;
  studentName: string;
  studentEnrollment: string;
  companyName: string;
  reportStartDate: string;
  reportEndDate: string;
  deliveredAt: string;
  status: string;
};
type Action = 'view' | 'edit' | 'submit' | 'review' | 'cancel';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppHeaderComponent],
  styleUrl: './internship-report-list.component.scss',
  template: `
    <main class="report-page">
      <app-header></app-header>
      <section class="page-heading"><div><p class="eyebrow">CONTROLE DE DOCUMENTOS</p><h1>Relatórios de estágio</h1><p>Cadastre, gere e acompanhe os relatórios de atividades.</p></div><button type="button" class="secondary" (click)="router.navigateByUrl('/inicio')">Voltar</button></section>

      <section class="search">
        <label>Pesquisar por</label>
        <div class="search-row">
          <select [value]="filterKey()" (change)="changeFilter($any($event.target).value)"><option *ngIf="auth.isCoordinator" value="enrollment">Matrícula do aluno</option><option value="company">Empresa</option><option value="status">Situação</option></select>
          <input *ngIf="filterKey() !== 'status'" [formControl]="control()" [placeholder]="filterKey() === 'company' ? 'Digite o nome da empresa' : 'Digite a matrícula'">
          <select *ngIf="filterKey() === 'status'" [formControl]="control()"><option value="">Selecione a situação</option><option *ngFor="let status of statuses" [value]="status">{{ statusLabel(status) }}</option></select>
          <button type="button" class="clear" (click)="clear()">Limpar</button><button type="button" class="search-button" (click)="search()">Pesquisar</button>
        </div>
      </section>

      <div class="actions-top"><button *ngIf="!auth.isCoordinator" type="button" class="register" (click)="router.navigateByUrl('/internship-reports/new')">+ Novo relatório</button></div>
      <p class="feedback" [class.error]="feedbackError()" *ngIf="feedback()">{{ feedback() }}</p>
      <div class="table-wrap"><table><thead><tr><th>Aluno</th><th>Matrícula</th><th>Empresa</th><th>Período relatado</th><th>Entrega</th><th>Situação</th><th class="right">Ações</th></tr></thead><tbody>
        <tr *ngFor="let item of items()"><td class="name">{{ item.studentName }}</td><td>{{ item.studentEnrollment }}</td><td>{{ item.companyName }}</td><td>{{ item.reportStartDate | date:'dd/MM/yyyy':'UTC' }} a {{ item.reportEndDate | date:'dd/MM/yyyy':'UTC' }}</td><td>{{ item.deliveredAt | date:'dd/MM/yyyy':'UTC' }}</td><td><span class="dot" [class]="'dot '+item.status"></span>{{ statusLabel(item.status) }}</td><td class="right action-cell"><button class="menu" type="button" aria-label="Abrir ações" [attr.aria-expanded]="activeActions() === item.id" (click)="toggleActions(item, $event)">⋮</button><div class="action-menu" *ngIf="activeActions() === item.id" [style.top.px]="menuTop()" [style.left.px]="menuLeft()" (click)="$event.stopPropagation()"><button *ngFor="let action of actions(item)" type="button" (click)="execute(item, action)"><span class="icon" aria-hidden="true" [ngSwitch]="action"><svg *ngSwitchCase="'view'" viewBox="0 0 24 24"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.7"/></svg><svg *ngSwitchCase="'edit'" viewBox="0 0 24 24"><path d="m4 16.8-.8 4 4-.8L19 8.2 15.8 5 4 16.8Z"/><path d="m14.8 6 3.2 3.2"/></svg><svg *ngSwitchCase="'submit'" viewBox="0 0 24 24"><path d="m3 11 18-8-7.5 18-2.3-7.7L3 11Z"/><path d="m11.2 13.3L21 3"/></svg><svg *ngSwitchCase="'review'" viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/><path d="m8 12 2.5 2.5L16 9"/></svg><svg *ngSwitchCase="'cancel'" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="m8.5 8.5 7 7m0-7-7 7"/></svg></span>{{ actionLabel(action) }}</button></div></td></tr>
        <tr *ngIf="!items().length"><td colspan="7" class="empty">Nenhum relatório encontrado.</td></tr>
      </tbody></table></div>
      <footer><span>Registros: <b>{{ items().length }}</b> de <b>{{ total() }}</b>.</span><div>Itens por página: <select [value]="pageSize()" (change)="size($any($event.target).value)"><option *ngFor="let number of [5,10,20,50,100]">{{ number }}</option></select><button type="button" aria-label="Página anterior" (click)="previous()">‹</button><b>{{ page() }}</b><button type="button" aria-label="Próxima página" (click)="next()">›</button></div></footer>
    </main>
  `,
})
export class InternshipReportListComponent {
  readonly statuses = ['EM_ELABORACAO', 'EM_ANALISE', 'CORRECAO_NECESSARIA', 'APROVADO', 'INDEFERIDO', 'CANCELADO'];
  items = signal<InternshipReport[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = signal(10);
  filterKey = signal(this.auth.isCoordinator ? 'enrollment' : 'company');
  activeActions = signal<string | null>(null);
  menuTop = signal(0);
  menuLeft = signal(0);
  feedback = signal('');
  feedbackError = signal(false);
  form = this.fb.group({ enrollment: '', company: '', status: '' });

  constructor(public auth: AuthService, private http: HttpClient, private fb: FormBuilder, public router: Router) { this.load(); }
  control() { return this.form.controls[this.filterKey() as keyof typeof this.form.controls]; }
  changeFilter(key: string) { this.filterKey.set(key); this.page.set(1); }
  statusLabel(status: string) { return ({ EM_ELABORACAO: 'Em elaboração', EM_ANALISE: 'Em análise', CORRECAO_NECESSARIA: 'Correção necessária', APROVADO: 'Aprovado', INDEFERIDO: 'Indeferido', CANCELADO: 'Cancelado' } as Record<string, string>)[status] || status; }
  actionLabel(action: Action) { return ({ view: 'Visualizar', edit: 'Editar', submit: 'Enviar para análise', review: 'Analisar relatório', cancel: 'Cancelar relatório' } as Record<Action, string>)[action]; }
  actions(item: InternshipReport): Action[] { if (this.auth.isCoordinator) return item.status === 'EM_ANALISE' ? ['review', 'view'] : ['view']; return ['EM_ELABORACAO', 'CORRECAO_NECESSARIA'].includes(item.status) ? ['view', 'edit', 'submit', 'cancel'] : ['view']; }
  toggleActions(item: InternshipReport, event: MouseEvent) {
    event.stopPropagation();
    if (this.activeActions() === item.id) { this.activeActions.set(null); return; }
    const trigger = event.currentTarget as HTMLElement;
    const rect = trigger.getBoundingClientRect();
    const menuWidth = 208;
    const menuHeight = this.actions(item).length * 39 + 12;
    const availableBelow = window.innerHeight - rect.bottom;
    this.menuLeft.set(Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8)));
    this.menuTop.set(availableBelow >= menuHeight + 8 ? rect.bottom + 6 : Math.max(8, rect.top - menuHeight - 6));
    this.activeActions.set(item.id);
  }
  @HostListener('document:click') closeActions() { this.activeActions.set(null); }
  @HostListener('document:keydown.escape') closeActionsOnEscape() { this.activeActions.set(null); }
  @HostListener('window:resize') closeActionsOnResize() { this.activeActions.set(null); }
  search() { this.page.set(1); this.load(); }
  clear() { this.form.reset(); this.page.set(1); this.load(); }
  size(value: string) { this.pageSize.set(Number(value)); this.page.set(1); this.load(); }
  previous() { if (this.page() > 1) { this.page.update(value => value - 1); this.load(); } }
  next() { if (this.page() * this.pageSize() < this.total()) { this.page.update(value => value + 1); this.load(); } }
  load() { let params = new HttpParams().set('page', this.page()).set('pageSize', this.pageSize()); const value = this.control().value; if (value) params = params.set(this.filterKey(), value); this.http.get<any>(`${this.auth.api}/internship-reports`, { params }).subscribe({ next: result => { this.items.set(result.items); this.total.set(result.total); }, error: response => this.message(response.error?.message || 'Não foi possível consultar os relatórios.', true) }); }
  execute(item: InternshipReport, action: Action) { this.activeActions.set(null); if (action === 'view') this.router.navigate(['/internship-reports', item.id]); if (action === 'edit') this.router.navigate(['/internship-reports', item.id, 'edit']); if (action === 'review') this.router.navigate(['/internship-reports', item.id], { queryParams: { review: 'true' } }); if (action === 'submit') this.transition(item, 'submit', 'Enviar este relatório para análise?'); if (action === 'cancel') this.transition(item, 'cancel', 'Cancelar este relatório? Esta operação não pode ser desfeita.'); }
  private transition(item: InternshipReport, operation: 'submit' | 'cancel', question: string) { if (!window.confirm(question)) return; this.http.post(`${this.auth.api}/internship-reports/${item.id}/${operation}`, {}).subscribe({ next: () => { this.message(operation === 'submit' ? 'Relatório enviado para análise.' : 'Relatório cancelado.', false); this.load(); }, error: response => this.message(response.error?.message || 'Não foi possível concluir a ação.', true) }); }
  private message(text: string, error: boolean) { this.feedback.set(text); this.feedbackError.set(error); window.setTimeout(() => this.feedback.set(''), 5000); }
}
