import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, computed, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../core/auth.service';

type HoursProgress = { id: string; number: string; company: string; status: string; hoursReported: number; startDate: string; endDate: string; totalDays: number; coveredDays: number; uncoveredPeriods: { startDate: string; endDate: string }[] };

@Component({
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  template: `
    <header><h2 mat-dialog-title>Horas relatadas</h2><p>Somente relatórios aprovados são contabilizados. Os períodos sem relatório aprovado podem incluir datas futuras.</p></header>
    <mat-dialog-content>
      <p *ngIf="loading()" class="notice" role="status">Carregando horas relatadas...</p>
      <div *ngIf="error()" class="notice error" role="alert"><p>{{ error() }}</p><button type="button" class="retry" (click)="load()">Tentar novamente</button></div>
      <p *ngIf="!loading() && !error() && !items().length" class="notice">Nenhum TCE encontrado.</p>
      <div class="total" *ngIf="!loading() && !error() && items().length">Total de horas relatadas: <strong>{{ totalHours() | number }} horas</strong></div>
      <div class="progress-list" *ngIf="!loading() && !error()">
        <article class="progress-card" *ngFor="let item of items()">
          <div class="card-heading"><h3>TCE {{ item.number }}</h3><span>{{ item.company }}</span></div>
          <p class="tce-status">Situação do TCE: {{ statusLabel(item.status) }}</p>
          <p class="period">Período do TCE: {{ item.startDate | date:'dd/MM/yyyy':'UTC' }} a {{ item.endDate | date:'dd/MM/yyyy':'UTC' }}</p>
          <div class="summary"><strong>{{ item.hoursReported | number }} horas relatadas</strong><span>{{ item.coveredDays | number }} de {{ item.totalDays | number }} dias com relatório aprovado</span></div>
          <progress [value]="item.coveredDays" [max]="item.totalDays" [attr.aria-label]="'Dias do TCE ' + item.number + ' com relatório aprovado'"></progress>
          <div class="missing" *ngIf="item.uncoveredPeriods.length; else periodCovered">
            <strong>Períodos sem relatório aprovado</strong>
            <ul><li *ngFor="let period of item.uncoveredPeriods">{{ period.startDate | date:'dd/MM/yyyy':'UTC' }} a {{ period.endDate | date:'dd/MM/yyyy':'UTC' }}</li></ul>
          </div>
          <ng-template #periodCovered><p class="complete">Todo o período possui relatório aprovado.</p></ng-template>
        </article>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end"><button type="button" class="close" (click)="dialogRef.close()">Fechar</button></mat-dialog-actions>
  `,
  styles: [`
    :host { display: block; font-family: Arial, sans-serif; color: #203a54; }
    header { padding: 24px 24px 16px; border-bottom: 1px solid #e1e7ed; }
    h2[mat-dialog-title] { margin: 0; padding: 0; color: #203a54; font: 600 22px/1.25 Arial, sans-serif; }
    header p { margin: 8px 0 0; color: #637587; font: 14px/1.5 Arial, sans-serif; }
    mat-dialog-content { padding: 20px 24px; }
    .total { margin-bottom: 16px; color: #52677b; font-size: 14px; }.total strong { color: #183b5c; }
    .progress-list { display: grid; gap: 12px; }
    .tce-status, .period { margin: 7px 0 0; color: #637587; font-size: 12px; }
    .missing, .complete { margin: 14px 0 0; color: #52677b; font-size: 12px; line-height: 1.5; }
    .missing ul { margin: 5px 0 0; padding-left: 18px; }.complete { color: #23743b; }
    .progress-card { padding: 16px; border: 1px solid #dce4eb; border-radius: 5px; background: #fafcfe; }
    .card-heading, .summary { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    h3 { margin: 0; color: #203a54; font-size: 15px; }
    .card-heading span { color: #637587; font-size: 13px; overflow-wrap: anywhere; }
    .summary { margin-top: 15px; color: #52677b; font-size: 13px; }
    .summary strong { color: #183b5c; font-size: 14px; }
    progress { display: block; width: 100%; height: 10px; margin-top: 10px; accent-color: #062b4b; }
    .notice { margin: 0; color: #52677b; font: 14px/1.5 Arial, sans-serif; }
    .notice p { margin: 0 0 10px; }.error { color: #a3211b; }
    mat-dialog-actions { padding: 16px 24px 24px; }
    .close, .retry { min-height: 38px; padding: 0 16px; border: 1px solid #062b4b; border-radius: 4px; background: #062b4b; color: white; font: 600 13px Arial, sans-serif; cursor: pointer; }
    button:focus-visible { outline: 3px solid #77a9d4; outline-offset: 2px; }
  `],
})
export class ReportedHoursDialogComponent implements OnInit {
  items = signal<HoursProgress[]>([]); loading = signal(true); error = signal('');
  totalHours = computed(() => this.items().reduce((sum, item) => sum + item.hoursReported, 0));
  statusLabel(status: string): string { return ({ EM_ELABORACAO: 'Em elaboração', EM_ANALISE: 'Em análise', CORRECAO_NECESSARIA: 'Correção necessária', APROVADO: 'Aprovado', INDEFERIDO: 'Indeferido', CANCELADO: 'Cancelado' } as Record<string, string>)[status] || status; }
  constructor(private http: HttpClient, private auth: AuthService, public dialogRef: MatDialogRef<ReportedHoursDialogComponent>) {}
  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading.set(true); this.error.set('');
    this.http.get<HoursProgress[]>(`${this.auth.api}/internship-reports/reported-hours`).subscribe({
      next: items => { this.items.set(items); this.loading.set(false); },
      error: () => { this.error.set('Não foi possível carregar as horas relatadas.'); this.loading.set(false); },
    });
  }
}
