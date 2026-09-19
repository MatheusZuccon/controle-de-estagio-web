import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrl: './tce-detail.component.scss',
  template: `
    <main class="detail-page" *ngIf="tce() as item">
      <header class="app-header"><div class="brand"><b>FT</b><span>FAETERJ Petrópolis — Sistema de Gestão de Estágios</span></div><button type="button" class="exit" (click)="router.navigateByUrl('/tces')">Sair</button></header>
      <section class="heading"><div><p class="eyebrow">CONTROLE DE DOCUMENTOS</p><h1>{{ reviewMode ? 'Analisar' : 'Visualizar' }} TCE</h1><p>Nº {{ item.number }} <span>•</span> {{ item.studentName }} <span>•</span> {{ item.company.name }}</p></div><span class="status" [class]="'status '+item.status">{{ label(item.status) }}</span></section>
      <p *ngIf="message()" class="feedback" [class.error]="messageError()">{{ message() }}</p>
      <section class="card">
        <div class="tabs"><button type="button" [class.active]="tab() === 'identification'" (click)="tab.set('identification')">Identificação</button><button type="button" [class.active]="tab() === 'history'" (click)="tab.set('history')">Histórico</button></div>
        <div class="content" *ngIf="tab() === 'identification'"><dl><div><dt>Matrícula</dt><dd>{{ item.studentEnrollment }}</dd></div><div><dt>Nome</dt><dd>{{ item.studentName }}</dd></div><div><dt>E-mail</dt><dd>{{ item.studentEmail }}</dd></div><div><dt>Telefone</dt><dd>{{ item.studentPhone }}</dd></div><div><dt>Empresa concedente</dt><dd>{{ item.company.name }}</dd></div><div><dt>Estágio remunerado</dt><dd>{{ item.isPaid ? 'Sim' : 'Não' }}</dd></div><div><dt>Período</dt><dd>{{ item.startDate | date:'dd/MM/yyyy' }} a {{ item.endDate | date:'dd/MM/yyyy' }}</dd></div></dl>
          <section class="documents"><h2>Documentos anexados</h2><div *ngFor="let document of item.documents" class="document"><span class="file-icon">{{ document.type === 'TCE_PDF' ? 'PDF' : 'IMG' }}</span><div><b>{{ document.originalName }}</b><small>{{ document.size | number }} bytes</small></div><button type="button" (click)="download(document)">Baixar</button></div><p *ngIf="!item.documents.length" class="muted">Nenhum documento disponível.</p></section>
        </div>
        <div class="content history" *ngIf="tab() === 'history'"><div *ngFor="let event of item.history" class="history-row"><span class="history-dot"></span><div><b>{{ event.fromStatus ? label(event.fromStatus) + ' → ' + label(event.toStatus) : 'TCE cadastrado' }}</b><p *ngIf="event.reason">{{ event.reason }}</p><small>{{ event.createdAt | date:'dd/MM/yyyy HH:mm:ss' }} · {{ event.actor?.email || 'Sistema' }}</small></div></div><p *ngIf="!item.history.length" class="muted">Ainda não há movimentações.</p></div>
      </section>
      <section class="review-card" *ngIf="reviewMode && auth.isCoordinator && item.status === 'EM_ANALISE'"><h2>Análise do coordenador</h2><p>Escolha a decisão para este TCE. Correção e indeferimento exigem uma justificativa.</p><div class="decision-options"><label><input type="radio" value="APPROVE" [(ngModel)]="decision"> Aprovar</label><label><input type="radio" value="REQUEST_CORRECTION" [(ngModel)]="decision"> Solicitar correção</label><label><input type="radio" value="REJECT" [(ngModel)]="decision"> Indeferir</label></div><label class="reason" *ngIf="decision !== 'APPROVE'">Motivo <span>*</span><textarea [(ngModel)]="reason" placeholder="Informe o motivo para o aluno"></textarea></label><div class="review-actions"><button type="button" class="secondary" (click)="router.navigateByUrl('/tces')">Cancelar</button><button type="button" class="primary" (click)="applyReview()">Confirmar decisão</button></div></section>
      <section class="record-actions" *ngIf="!reviewMode"><button type="button" class="secondary" (click)="router.navigateByUrl('/tces')">Voltar</button><button type="button" class="secondary" *ngIf="canEdit(item)" (click)="router.navigate(['/tces', item.id, 'edit'])">✎ Editar</button><button type="button" class="primary" *ngIf="canSubmit(item)" (click)="transition('submit')">➤ Enviar para análise</button><button type="button" class="danger" *ngIf="canCancel(item)" (click)="transition('cancel')">⊗ Cancelar TCE</button><button type="button" class="primary" *ngIf="canReview(item)" (click)="router.navigate(['/tces', item.id], { queryParams: { review: 'true' } })">✓ Analisar TCE</button></section>
      <footer class="audit"><button type="button" (click)="auditOpen.update(value => !value)">Auditoria do TCE <span>{{ auditOpen() ? '⌃' : '⌄' }}</span></button><div *ngIf="auditOpen()"><p><b>Criação:</b> {{ item.createdAt | date:'dd/MM/yyyy HH:mm:ss' }} UTC</p><p><b>Última alteração:</b> {{ item.updatedAt | date:'dd/MM/yyyy HH:mm:ss' }} UTC</p></div></footer>
    </main>
  `
})
export class TceDetailComponent implements OnInit {
  tce = signal<any>(null); tab = signal<'identification' | 'history'>('identification'); auditOpen = signal(false); message = signal(''); messageError = signal(false);
  id = ''; reviewMode = false; decision = 'APPROVE'; reason = '';
  constructor(private route: ActivatedRoute, public router: Router, private http: HttpClient, public auth: AuthService) {}
  ngOnInit(): void { this.id = this.route.snapshot.paramMap.get('id') || ''; this.reviewMode = this.route.snapshot.queryParamMap.get('review') === 'true'; this.load(); }
  label(status: string) { return ({ EM_ELABORACAO: 'Em elaboração', EM_ANALISE: 'Em análise', CORRECAO_NECESSARIA: 'Correção necessária', APROVADO: 'Aprovado', INDEFERIDO: 'Indeferido', CANCELADO: 'Cancelado' } as Record<string, string>)[status] || status; }
  canEdit(item: any) { return !this.auth.isCoordinator && ['EM_ELABORACAO', 'CORRECAO_NECESSARIA'].includes(item.status); }
  canSubmit(item: any) { return !this.auth.isCoordinator && ['EM_ELABORACAO', 'CORRECAO_NECESSARIA'].includes(item.status); }
  canCancel(item: any) { return !this.auth.isCoordinator && ['EM_ELABORACAO', 'CORRECAO_NECESSARIA'].includes(item.status); }
  canReview(item: any) { return this.auth.isCoordinator && item.status === 'EM_ANALISE'; }
  load() { this.http.get<any>(`${this.auth.api}/tces/${this.id}`).subscribe({ next: item => this.tce.set(item), error: response => this.notice(response.error?.message || 'Não foi possível carregar o TCE.', true) }); }
  download(file: any) { this.http.get(`${this.auth.api}/tces/${this.id}/documents/${file.id}/download`, { responseType: 'blob' }).subscribe({ next: blob => { const anchor = window.document.createElement('a'); anchor.href = URL.createObjectURL(blob); anchor.download = file.originalName; anchor.click(); URL.revokeObjectURL(anchor.href); }, error: response => this.notice(response.error?.message || 'Não foi possível baixar o arquivo.', true) }); }
  transition(operation: 'submit' | 'cancel') { const question = operation === 'submit' ? 'Enviar o TCE para análise? A edição será bloqueada.' : 'Cancelar este TCE? Esta operação não pode ser desfeita.'; if (!window.confirm(question)) return; this.http.post(`${this.auth.api}/tces/${this.id}/${operation}`, {}).subscribe({ next: () => this.router.navigateByUrl('/tces'), error: response => this.notice(response.error?.message || 'Não foi possível concluir a ação.', true) }); }
  applyReview() { if (this.decision !== 'APPROVE' && !this.reason.trim()) { this.notice('Informe o motivo para solicitar correção ou indeferir.', true); return; } const reason = this.decision === 'APPROVE' ? undefined : this.reason.trim(); this.http.post(`${this.auth.api}/tces/${this.id}/review`, { decision: this.decision, reason }).subscribe({ next: () => this.router.navigateByUrl('/tces'), error: response => this.notice(response.error?.message || 'Não foi possível registrar a decisão.', true) }); }
  private notice(text: string, error: boolean) { this.message.set(text); this.messageError.set(error); }
}
