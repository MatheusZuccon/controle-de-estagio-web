import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, HostListener, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { HasUnsavedChanges, preventUnloadWithUnsavedChanges } from '../../core/pending-changes.guard';
import { AppHeaderComponent } from '../../shared/app-header.component';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, AppHeaderComponent],
  styleUrl: './internship-report-detail.component.scss',
  template: `
    <main class="detail-page" *ngIf="report() as item">
      <app-header></app-header>
      <section class="heading"><div><p class="eyebrow">CONTROLE DE DOCUMENTOS</p><h1>{{ reviewMode ? 'Analisar' : 'Visualizar' }} relatório de estágio</h1><p>{{ item.studentName }} <span>•</span> {{ item.companyName }}</p></div><div class="heading-actions"><button type="button" class="secondary" (click)="router.navigateByUrl('/internship-reports')">Voltar</button><button type="button" class="primary" *ngIf="reviewMode && auth.isCoordinator && item.status === 'EM_ANALISE'" (click)="applyReview()">Confirmar decisão</button><span class="status" [class]="'status '+item.status">{{ statusLabel(item.status) }}</span></div></section>
      <p *ngIf="message()" class="feedback" [class.error]="messageError()">{{ message() }}</p>

      <section class="card"><div class="tabs"><button type="button" [class.active]="tab() === 'identification'" (click)="tab.set('identification')">Identificação</button><button type="button" [class.active]="tab() === 'activities'" (click)="tab.set('activities')">Atividades</button><button type="button" [class.active]="tab() === 'history'" (click)="tab.set('history')">Histórico</button></div>
        <div class="content" *ngIf="tab() === 'identification'"><dl><div><dt>Matrícula</dt><dd>{{ item.studentEnrollment }}</dd></div><div><dt>Aluno</dt><dd>{{ item.studentName }}</dd></div><div><dt>E-mail</dt><dd>{{ item.studentEmail }}</dd></div><div><dt>Telefone</dt><dd>{{ item.studentPhone }}</dd></div><div><dt>Tipo de estágio</dt><dd>{{ typeLabel(item.internshipType) }}</dd></div><div><dt>Empresa</dt><dd>{{ item.companyName }}</dd></div><div><dt>Período relatado</dt><dd>{{ item.reportStartDate | date:'dd/MM/yyyy':'UTC' }} a {{ item.reportEndDate | date:'dd/MM/yyyy':'UTC' }}</dd></div><div><dt>Período no contrato</dt><dd>{{ item.contractStartDate | date:'dd/MM/yyyy':'UTC' }} a {{ item.contractEndDate | date:'dd/MM/yyyy':'UTC' }}</dd></div><div><dt>Data de entrega</dt><dd>{{ item.deliveredAt | date:'dd/MM/yyyy':'UTC' }}</dd></div><div><dt>Horas relatadas</dt><dd>{{ item.hoursReported }}</dd></div></dl>
          <section class="documents"><h2>Documento gerado</h2><div *ngFor="let document of item.documents" class="document"><span class="file-icon">PDF</span><div><b>{{ document.originalName }}</b><small>{{ document.size | number }} bytes</small></div><button type="button" (click)="download(document)">Baixar</button></div><p *ngIf="!item.documents.length" class="muted">O PDF ainda não foi gerado.</p></section>
        </div>
        <div class="content activities" *ngIf="tab() === 'activities'"><h2>Atividades realizadas</h2><p>{{ item.activities }}</p></div>
        <div class="content history" *ngIf="tab() === 'history'"><div *ngFor="let event of item.history" class="history-row"><span class="history-dot"></span><div><b>{{ event.fromStatus ? statusLabel(event.fromStatus) + ' → ' + statusLabel(event.toStatus) : 'Relatório cadastrado' }}</b><p *ngIf="event.reason">{{ event.reason }}</p><small>{{ event.createdAt | date:'dd/MM/yyyy HH:mm:ss' }} · {{ event.actor?.email || 'Sistema' }}</small></div></div><p *ngIf="!item.history.length" class="muted">Ainda não há movimentações.</p></div>
      </section>

      <section class="review-card" *ngIf="reviewMode && auth.isCoordinator && item.status === 'EM_ANALISE'"><h2>Análise do coordenador</h2><p>Escolha a decisão. Correção e indeferimento exigem uma justificativa.</p><div class="decision-options"><label><input type="radio" value="APPROVE" [(ngModel)]="decision"> Aprovar</label><label><input type="radio" value="REQUEST_CORRECTION" [(ngModel)]="decision"> Solicitar correção</label><label><input type="radio" value="REJECT" [(ngModel)]="decision"> Indeferir</label></div><label class="reason" *ngIf="decision !== 'APPROVE'">Motivo <span>*</span><textarea [(ngModel)]="reason" placeholder="Informe o motivo para o aluno"></textarea></label><div class="review-actions"><button type="button" class="secondary" (click)="router.navigateByUrl('/internship-reports')">Cancelar</button><button type="button" class="primary" (click)="applyReview()">Confirmar decisão</button></div></section>

      <section class="record-actions" *ngIf="!reviewMode"><button type="button" class="secondary" (click)="router.navigateByUrl('/internship-reports')">Voltar</button><button type="button" class="secondary" *ngIf="canEdit(item)" (click)="router.navigate(['/internship-reports', item.id, 'edit'])">Editar</button><button type="button" class="secondary" *ngIf="canEdit(item)" (click)="generate()">Gerar PDF</button><button type="button" class="primary" *ngIf="canSubmit(item)" (click)="transition('submit')">Enviar para análise</button><button type="button" class="danger" *ngIf="canCancel(item)" (click)="transition('cancel')">Cancelar relatório</button><button type="button" class="primary" *ngIf="canReview(item)" (click)="router.navigate(['/internship-reports', item.id], { queryParams: { review: 'true' } })">Analisar relatório</button></section>
      <footer class="audit"><button type="button" (click)="auditOpen.update(value => !value)">Auditoria do relatório <span>{{ auditOpen() ? '⌃' : '⌄' }}</span></button><div *ngIf="auditOpen()"><p><b>Criação:</b> {{ item.createdAt | date:'dd/MM/yyyy HH:mm:ss' }}</p><p><b>Última alteração:</b> {{ item.updatedAt | date:'dd/MM/yyyy HH:mm:ss' }}</p></div></footer>
    </main>
  `,
})
export class InternshipReportDetailComponent implements OnInit, HasUnsavedChanges {
  report = signal<any>(null);
  tab = signal<'identification' | 'activities' | 'history'>('identification');
  auditOpen = signal(false);
  message = signal('');
  messageError = signal(false);
  id = '';
  reviewMode = false;
  decision = 'APPROVE';
  reason = '';
  reviewSubmitted = false;
  constructor(private route: ActivatedRoute, public router: Router, private http: HttpClient, public auth: AuthService) {}
  ngOnInit() { this.id = this.route.snapshot.paramMap.get('id') || ''; this.reviewMode = this.route.snapshot.queryParamMap.get('review') === 'true'; this.load(); }
  statusLabel(status: string) { return ({ EM_ELABORACAO: 'Em elaboração', EM_ANALISE: 'Em análise', CORRECAO_NECESSARIA: 'Correção necessária', APROVADO: 'Aprovado', INDEFERIDO: 'Indeferido', CANCELADO: 'Cancelado' } as Record<string, string>)[status] || status; }
  typeLabel(type: string) { return ({ SUPERVISIONADO: 'Supervisionado', VOLUNTARIO: 'Voluntário', OUTRO: 'Outro' } as Record<string, string>)[type] || type; }
  canEdit(item: any) { return !this.auth.isCoordinator && ['EM_ELABORACAO', 'CORRECAO_NECESSARIA'].includes(item.status); }
  canSubmit(item: any) { return this.canEdit(item) && item.documents?.length > 0; }
  canCancel(item: any) { return this.canEdit(item); }
  canReview(item: any) { return this.auth.isCoordinator && item.status === 'EM_ANALISE'; }
  hasUnsavedChanges() { const item = this.report(); return Boolean(item && this.reviewMode && !this.reviewSubmitted && this.canReview(item) && (this.decision !== 'APPROVE' || this.reason !== '')); }
  @HostListener('window:beforeunload', ['$event']) beforeUnload(event: BeforeUnloadEvent): void { preventUnloadWithUnsavedChanges(event, this.hasUnsavedChanges()); }
  load() { this.http.get<any>(`${this.auth.api}/internship-reports/${this.id}`).subscribe({ next: report => this.report.set(report), error: response => this.notice(response.error?.message || 'Não foi possível carregar o relatório.', true) }); }
  generate() { this.http.post(`${this.auth.api}/internship-reports/${this.id}/generate-document`, {}).subscribe({ next: () => { this.notice('PDF gerado com sucesso.', false); this.load(); }, error: response => this.notice(response.error?.message || 'Não foi possível gerar o PDF.', true) }); }
  download(document: any) { this.http.get(`${this.auth.api}/internship-reports/${this.id}/documents/${document.id}/download`, { responseType: 'blob' }).subscribe({ next: blob => { const anchor = window.document.createElement('a'); anchor.href = URL.createObjectURL(blob); anchor.download = document.originalName; anchor.click(); URL.revokeObjectURL(anchor.href); }, error: response => this.notice(response.error?.message || 'Não foi possível baixar o PDF.', true) }); }
  transition(operation: 'submit' | 'cancel') { const question = operation === 'submit' ? 'Enviar o relatório para análise? A edição será bloqueada.' : 'Cancelar este relatório? Esta operação não pode ser desfeita.'; if (!window.confirm(question)) return; this.http.post(`${this.auth.api}/internship-reports/${this.id}/${operation}`, {}).subscribe({ next: () => this.router.navigateByUrl('/internship-reports'), error: response => this.notice(response.error?.message || 'Não foi possível concluir a ação.', true) }); }
  applyReview() { if (this.decision !== 'APPROVE' && !this.reason.trim()) { this.notice('Informe o motivo para solicitar correção ou indeferir.', true); return; } const reason = this.decision === 'APPROVE' ? undefined : this.reason.trim(); this.http.post(`${this.auth.api}/internship-reports/${this.id}/review`, { decision: this.decision, reason }).subscribe({ next: () => { this.reviewSubmitted = true; this.router.navigateByUrl('/internship-reports'); }, error: response => this.notice(response.error?.message || 'Não foi possível registrar a decisão.', true) }); }
  private notice(text: string, error: boolean) { this.message.set(text); this.messageError.set(error); }
}
