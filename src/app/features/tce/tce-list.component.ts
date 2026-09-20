import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { AppHeaderComponent } from '../../shared/app-header.component';

type Tce = { id: string; number: string; studentName: string; studentEnrollment: string; company: { name: string }; createdAt: string; status: string };
type Action = 'view' | 'edit' | 'submit' | 'review' | 'cancel';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppHeaderComponent],
  styleUrl: './tce-list.component.scss',
  template: `
    <main class="tce-page">
      <app-header></app-header><section class="page-heading"><h1 class="page-title">Controle de TCE</h1><button type="button" class="secondary header-back" (click)="router.navigateByUrl('/inicio')">Voltar</button></section>
      <section class="search"><label>Pesquisar por</label><div class="search-row"><select [value]="filterKey()" (change)="changeFilter($any($event.target).value)"><option value="number">Número do TCE</option><option *ngIf="auth.isCoordinator" value="studentName">Nome do estagiário</option><option *ngIf="auth.isCoordinator" value="enrollment">Matrícula do estagiário</option><option value="company">Nome da empresa</option><option value="status">Situação do TCE</option></select><input *ngIf="filterKey() !== 'status'" [formControl]="control()" [placeholder]="placeholder()"><select *ngIf="filterKey() === 'status'" [formControl]="control()"><option value="">Selecione a situação</option><option *ngFor="let status of statuses" [value]="status">{{ label(status) }}</option></select><button class="clear" (click)="clear()">Limpar</button><button class="search-button" (click)="search()">Pesquisar</button></div></section>
      <div class="actions-top"><button *ngIf="!auth.isCoordinator" class="register" (click)="router.navigateByUrl('/tces/new')">+ Cadastrar TCE</button></div>
      <p class="feedback" [class.error]="feedbackError()" *ngIf="feedback()">{{ feedback() }}</p>
      <table><thead><tr><th>Nº do TCE</th><th>Estagiário</th><th>Matrícula</th><th>Empresa</th><th>Data de inserção</th><th>Situação</th><th class="right">Ações</th></tr></thead><tbody>
        <tr *ngFor="let item of items()"><td class="number">{{ item.number }}</td><td>{{ item.studentName }}</td><td>{{ item.studentEnrollment }}</td><td>{{ item.company.name }}</td><td>{{ item.createdAt | date:'dd/MM/yyyy' }}</td><td><span class="dot" [class]="'dot '+item.status"></span>{{ label(item.status) }}</td><td class="right action-cell"><button class="menu" type="button" title="Ações disponíveis" (click)="toggleActions(item.id)"><span>⋮</span><span class="visually-hidden">Ações</span></button><div class="action-menu" *ngIf="activeActions() === item.id"><button *ngFor="let available of actions(item)" type="button" (click)="execute(item, available)"><span class="icon" [ngSwitch]="available"><svg *ngSwitchCase="'view'" viewBox="0 0 24 24"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.7"/></svg><svg *ngSwitchCase="'edit'" viewBox="0 0 24 24"><path d="m4 16.8-.8 4 4-.8L19 8.2 15.8 5 4 16.8Z"/><path d="m14.8 6 3.2 3.2"/></svg><svg *ngSwitchCase="'submit'" viewBox="0 0 24 24"><path d="m3 11 18-8-7.5 18-2.3-7.7L3 11Z"/><path d="m11.2 13.3L21 3"/></svg><svg *ngSwitchCase="'review'" viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/><path d="m8 12 2.5 2.5L16 9"/></svg><svg *ngSwitchCase="'cancel'" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="m8.5 8.5 7 7m0-7-7 7"/></svg></span>{{ actionLabel(available) }}</button></div></td></tr>
        <tr *ngIf="!items().length"><td colspan="7" class="empty">Nenhum TCE encontrado.</td></tr>
      </tbody></table>
      <footer><span>Registros: <b>{{ items().length }}</b> de <b>{{ total() }}</b> registros localizados.</span><div>Itens por página: <select [value]="pageSize()" (change)="size($any($event.target).value)"><option *ngFor="let number of [5,10,20,50,100]">{{ number }}</option></select><button type="button" title="Página anterior" (click)="previous()">‹</button><b>{{ page() }}</b><button type="button" title="Próxima página" (click)="next()">›</button></div></footer>
    </main>
  `
})
export class TceListComponent {
  readonly statuses = ['EM_ELABORACAO', 'EM_ANALISE', 'CORRECAO_NECESSARIA', 'APROVADO', 'INDEFERIDO', 'CANCELADO'];
  items = signal<Tce[]>([]); total = signal(0); page = signal(1); pageSize = signal(10); filterKey = signal('number'); activeActions = signal<string | null>(null); feedback = signal(''); feedbackError = signal(false);
  form = this.fb.group({ number: '', studentName: '', enrollment: '', company: '', status: '' });
  constructor(public auth: AuthService, private http: HttpClient, private fb: FormBuilder, public router: Router) { this.load(); }
  control() { return this.form.controls[this.filterKey() as keyof typeof this.form.controls]; }
  changeFilter(key: string) { this.filterKey.set(key); this.page.set(1); }
  placeholder() { return this.filterKey() === 'number' ? 'Digite o número do TCE' : this.filterKey() === 'company' ? 'Digite o nome da empresa' : 'Digite para pesquisar'; }
  label(status: string) { return ({ EM_ELABORACAO: 'Em elaboração', EM_ANALISE: 'Em análise', CORRECAO_NECESSARIA: 'Correção necessária', APROVADO: 'Aprovado', INDEFERIDO: 'Indeferido', CANCELADO: 'Cancelado' } as Record<string, string>)[status] || status; }
  actionLabel(action: Action) { return ({ view: 'Visualizar', edit: 'Editar', submit: 'Enviar para análise', review: 'Analisar TCE', cancel: 'Cancelar TCE' } as Record<Action, string>)[action]; }
  actions(item: Tce): Action[] { if (this.auth.isCoordinator) return item.status === 'EM_ANALISE' ? ['review', 'view'] : ['view']; return ['EM_ELABORACAO', 'CORRECAO_NECESSARIA'].includes(item.status) ? ['view', 'edit', 'submit', 'cancel'] : ['view']; }
  toggleActions(id: string) { this.activeActions.update(current => current === id ? null : id); }
  search() { this.page.set(1); this.load(); }
  load() { let params = new HttpParams().set('page', this.page()).set('pageSize', this.pageSize()); const value = this.control().value; if (value) params = params.set(this.filterKey(), value); this.http.get<any>(`${this.auth.api}/tces`, { params }).subscribe({ next: result => { this.items.set(result.items); this.total.set(result.total); }, error: response => this.message(response.error?.message || 'Não foi possível consultar os TCEs.', true) }); }
  clear() { this.form.reset(); this.page.set(1); this.load(); }
  size(value: string) { this.pageSize.set(+value); this.page.set(1); this.load(); }
  previous() { if (this.page() > 1) { this.page.update(value => value - 1); this.load(); } }
  next() { if (this.page() * this.pageSize() < this.total()) { this.page.update(value => value + 1); this.load(); } }
  execute(item: Tce, action: Action) { this.activeActions.set(null); if (action === 'view') this.router.navigate(['/tces', item.id]); if (action === 'edit') this.router.navigate(['/tces', item.id, 'edit']); if (action === 'review') this.router.navigate(['/tces', item.id], { queryParams: { review: 'true' } }); if (action === 'submit') this.transition(item, 'submit', 'Enviar este TCE para análise? Após o envio, ele não poderá mais ser editado.'); if (action === 'cancel') this.transition(item, 'cancel', 'Cancelar este TCE? Esta operação não pode ser desfeita.'); }
  private transition(item: Tce, operation: 'submit' | 'cancel', confirmation: string) { if (!window.confirm(confirmation)) return; this.http.post(`${this.auth.api}/tces/${item.id}/${operation}`, {}).subscribe({ next: () => { this.message(operation === 'submit' ? 'TCE enviado para análise.' : 'TCE cancelado com sucesso.', false); this.load(); }, error: response => this.message(response.error?.message || 'Não foi possível concluir a ação.', true) }); }
  private message(text: string, error: boolean) { this.feedback.set(text); this.feedbackError.set(error); window.setTimeout(() => this.feedback.set(''), 5000); }
}
