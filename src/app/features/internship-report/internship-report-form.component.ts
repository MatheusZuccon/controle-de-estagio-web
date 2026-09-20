import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatError } from '@angular/material/form-field';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { HasUnsavedChanges, preventUnloadWithUnsavedChanges } from '../../core/pending-changes.guard';
import { AppHeaderComponent } from '../../shared/app-header.component';

type InternshipType = 'SUPERVISIONADO' | 'VOLUNTARIO' | 'OUTRO';
type TceOption = { id: string; number: string; company: string; internshipType: InternshipType; startDate: string; endDate: string };
type FormData = { student: { name: string; enrollment: string; email: string; phone: string; internshipType: InternshipType }; tces: TceOption[] };

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatError, AppHeaderComponent],
  styleUrl: './internship-report-form.component.scss',
  templateUrl: './internship-report-form.component.html',
})
export class InternshipReportFormComponent implements OnInit, HasUnsavedChanges {
  readonly internshipTypes = [['SUPERVISIONADO', 'Supervisionado'], ['VOLUNTARIO', 'Voluntário'], ['OUTRO', 'Outro']] as const;
  id = '';
  student?: FormData['student'];
  tces: TceOption[] = [];
  error = '';
  submitted = false;
  saving = false;
  form = this.fb.group({
    tceId: ['', Validators.required],
    internshipType: ['', Validators.required],
    reportStartDate: ['', Validators.required],
    reportEndDate: ['', Validators.required],
    deliveredAt: ['', Validators.required],
    hoursReported: ['', [Validators.required, Validators.pattern('^[0-9]+$'), Validators.min(1), Validators.max(10000)]],
    activities: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(6000)]],
  });

  constructor(private fb: FormBuilder, private route: ActivatedRoute, public router: Router, private http: HttpClient, public auth: AuthService) {}
  get selectedTce() { return this.tces.find(tce => tce.id === this.form.controls.tceId.value); }
  showError(field: string) { const control = this.form.get(field); return Boolean(control?.invalid && (control.dirty || control.touched || this.submitted)); }
  errorMessage(field: string) { const errors = this.form.get(field)?.errors || {}; const labels: Record<string, string> = { tceId: 'TCE', internshipType: 'Tipo de estágio', reportStartDate: 'Início do período relatado', reportEndDate: 'Fim do período relatado', deliveredAt: 'Data de entrega', hoursReported: 'Horas relatadas', activities: 'Atividades realizadas' }; if (errors.required) return `${labels[field]} é obrigatório.`; if (errors.pattern) return 'Informe somente números.'; if (errors.min) return 'Informe pelo menos uma hora.'; if (errors.max) return 'O limite é de 10000 horas.'; if (errors.minlength) return `${labels[field]} deve ter ao menos 3 caracteres.`; if (errors.maxlength) return `${labels[field]} deve ter no máximo 6000 caracteres.`; return 'Valor inválido.'; }

  ngOnInit() {
    if (this.auth.isCoordinator) { this.router.navigateByUrl('/internship-reports'); return; }
    this.id = this.route.snapshot.paramMap.get('id') || '';
    this.http.get<FormData>(`${this.auth.api}/internship-reports/form-data`).subscribe({
      next: data => { this.student = data.student; this.tces = data.tces; if (this.id) this.loadReport(); else { this.form.patchValue({ internshipType: data.student.internshipType }); if (data.tces.length === 1) { this.form.controls.tceId.setValue(data.tces[0].id); this.selectTce(); } } },
      error: response => this.error = response.error?.message || 'Não foi possível carregar os dados do formulário.',
    });
  }

  selectTce() { const tce = this.selectedTce; if (!tce) return; this.form.controls.internshipType.setValue(tce.internshipType); }
  digitsOnly() { const control = this.form.controls.hoursReported; control.setValue((control.value || '').replace(/\D/g, '').slice(0, 5), { emitEvent: false }); }
  hasUnsavedChanges(): boolean { return this.form.dirty; }
  @HostListener('window:beforeunload', ['$event']) beforeUnload(event: BeforeUnloadEvent): void { preventUnloadWithUnsavedChanges(event, this.hasUnsavedChanges()); }
  save() {
    this.submitted = true;
    this.error = '';
    if (this.form.invalid) { this.form.markAllAsTouched(); this.error = 'Preencha corretamente todos os campos obrigatórios.'; return; }
    const tce = this.selectedTce;
    const start = this.form.controls.reportStartDate.value || '';
    const end = this.form.controls.reportEndDate.value || '';
    if (!tce || start < tce.startDate.slice(0, 10) || end > tce.endDate.slice(0, 10) || end < start) { this.error = 'O período relatado deve estar dentro do período do contrato e a data final deve ser posterior à inicial.'; return; }
    this.saving = true;
    const request = this.id ? this.http.patch<any>(`${this.auth.api}/internship-reports/${this.id}`, this.form.getRawValue()) : this.http.post<any>(`${this.auth.api}/internship-reports`, this.form.getRawValue());
    request.subscribe({ next: report => { const id = report.id || this.id; this.form.markAsPristine(); this.http.post(`${this.auth.api}/internship-reports/${id}/generate-document`, {}).subscribe({ next: () => this.router.navigate(['/internship-reports', id]), error: response => { this.saving = false; this.error = response.error?.message || 'O relatório foi salvo, mas não foi possível gerar o PDF.'; } }); }, error: response => { this.saving = false; this.error = response.error?.message || 'Não foi possível salvar o relatório.'; } });
  }

  private loadReport() { this.http.get<any>(`${this.auth.api}/internship-reports/${this.id}`).subscribe({ next: report => this.form.patchValue({ tceId: report.tceId, internshipType: report.internshipType, reportStartDate: report.reportStartDate.slice(0, 10), reportEndDate: report.reportEndDate.slice(0, 10), deliveredAt: report.deliveredAt.slice(0, 10), hoursReported: String(report.hoursReported), activities: report.activities }), error: response => this.error = response.error?.message || 'Não foi possível carregar o relatório.' }); }
}
