import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, HostListener, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatError } from '@angular/material/form-field';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { HasUnsavedChanges, preventUnloadWithUnsavedChanges } from '../../core/pending-changes.guard';
import { AppHeaderComponent } from '../../shared/app-header.component';
import { PhotoFrameComponent } from '../../shared/photo-frame.component';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatError, AppHeaderComponent, PhotoFrameComponent],
  styleUrl: './tce-form.component.scss',
  templateUrl: './tce-form.component.html'
})
export class TceFormComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  readonly internshipTypes = [['SUPERVISIONADO', 'Supervisionado'], ['VOLUNTARIO', 'Voluntário'], ['OUTRO', 'Outro']] as const;
  id = '';
  document?: File;
  photoPreview = signal('');
  photoLoading = signal(true);
  photoLoadError = signal(false);
  private destroyed = false;
  private previousStipend = '';
  existingDocument?: any;
  error = ''; submitted = false; saved = false;
  form = this.fb.group({ number: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20), Validators.pattern('^[0-9]+$')]], enrollment: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(16), Validators.pattern('^[0-9]+$')]], studentName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]], email: ['', [Validators.required, Validators.email, Validators.minLength(3)]], phone: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(15)]], companyName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]], internshipType: ['', Validators.required], isPaid: [null as boolean | null, Validators.required], stipendAmount: this.fb.control({ value: '', disabled: true }), startDate: ['', [Validators.required, control => control.value && control.value < this.today ? { startInPast: true } : null]], endDate: ['', [Validators.required, control => control.value && control.parent?.get('startDate')?.value && control.value <= control.parent.get('startDate')?.value ? { endNotAfterStart: true } : null]] });

  constructor(private fb: FormBuilder, private route: ActivatedRoute, public router: Router, private http: HttpClient, public auth: AuthService) { this.form.controls.startDate.valueChanges.subscribe(() => this.form.controls.endDate.updateValueAndValidity()); }
  get today(): string { const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()); const part = (type: string) => parts.find(item => item.type === type)?.value; return `${part('year')}-${part('month')}-${part('day')}`; }
  get earliestEndDate(): string { const start = this.form.controls.startDate.value; if (!start) return this.today; const next = new Date(`${start}T00:00:00.000Z`); next.setUTCDate(next.getUTCDate() + 1); return Number.isNaN(next.getTime()) ? this.today : next.toISOString().slice(0, 10); }
  get canSave(): boolean { return this.form.valid && (Boolean(this.id) || Boolean(this.document)); }
  showError(field: string): boolean { const control = this.form.get(field); return Boolean(control?.invalid && (control.touched || control.dirty || this.submitted)); }
  showDocumentError(): boolean { return this.submitted && !this.id && !this.document; }
  errorMessage(field: string): string { const errors = this.form.get(field)?.errors || {}; const labels: Record<string, string> = { number: 'Número do TCE', companyName: 'Empresa concedente', enrollment: 'Matrícula', studentName: 'Nome do estagiário', email: 'E-mail institucional', phone: 'Telefone celular', internshipType: 'Tipo de estágio', isPaid: 'Estágio remunerado', stipendAmount: 'Valor da bolsa', startDate: 'Início do estágio', endDate: 'Término do estágio' }; if (errors.stipendMax) return 'O valor da bolsa deve conter no máximo sete dígitos, incluindo os centavos.'; if (errors.startInPast) return 'A data de início deve ser igual ou posterior à data atual.'; if (errors.endNotAfterStart) return 'A data de término deve ser posterior à data de início.'; if (errors.required) return `${labels[field]} é obrigatório.`; if (errors.minlength) return `${labels[field]} deve ter ao menos ${errors.minlength.requiredLength} caracteres.`; if (errors.maxlength) return `${labels[field]} excede o tamanho permitido.`; if (errors.email) return 'Informe um e-mail válido.'; if (errors.pattern) return field === 'number' || field === 'enrollment' ? `${labels[field]} deve conter apenas números.` : field === 'stipendAmount' ? 'Informe um valor de bolsa válido.' : 'Valor inválido.'; return 'Valor inválido.'; }
  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') || '';
    this.http.get<any>(`${this.auth.api}/students/me`).subscribe({
      next: profile => {
        if (this.destroyed) return;
        if (!this.id) this.form.patchValue({ enrollment: profile.enrollment, studentName: profile.name, email: profile.email, phone: profile.phone, internshipType: profile.internshipType });
        if (profile.photoAvailable) this.http.get(`${this.auth.api}/students/me/photo`, { responseType: 'blob' }).subscribe({
          next: blob => { if (!this.destroyed) { this.photoPreview.set(URL.createObjectURL(blob)); this.photoLoading.set(false); } },
          error: () => { if (!this.destroyed) { this.photoLoadError.set(true); this.photoLoading.set(false); } },
        });
        else this.photoLoading.set(false);
      },
      error: () => { if (!this.destroyed) { this.photoLoadError.set(true); this.photoLoading.set(false); } },
    });
    if (this.id) this.http.get<any>(`${this.auth.api}/tces/${this.id}`).subscribe(tce => {
      this.existingDocument = tce.documents?.find((file: any) => file.type === 'TCE_PDF');
      this.form.patchValue({ number: tce.number, enrollment: tce.studentEnrollment, studentName: tce.studentName, email: tce.studentEmail, phone: tce.studentPhone, companyName: tce.company.name, internshipType: tce.internshipType, isPaid: tce.isPaid, stipendAmount: this.currency(tce.stipendAmount), startDate: tce.startDate.slice(0, 10), endDate: tce.endDate.slice(0, 10) });
      this.updateStipendAvailability();
      this.previousStipend = this.form.controls.stipendAmount.value || '';
    });
  }
  ngOnDestroy(): void { this.destroyed = true; if (this.photoPreview()) URL.revokeObjectURL(this.photoPreview()); }
  digitsOnly(field: 'number' | 'enrollment'): void { const control = this.form.controls[field]; control.setValue((control.value || '').replace(/\D/g, ''), { emitEvent: false }); }
  formatPhone(): void { const control = this.form.controls.phone; const digits = (control.value || '').replace(/\D/g, '').slice(0, 11); const formatted = digits.length <= 2 ? (digits ? `(${digits}` : '') : digits.length <= 6 ? `(${digits.slice(0, 2)}) ${digits.slice(2)}` : `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`; control.setValue(formatted, { emitEvent: false }); }
  updateStipendAvailability(): void { const control = this.form.controls.stipendAmount; if (this.form.controls.isPaid.value === true) { control.enable({ emitEvent: false }); control.setValidators([Validators.required, Validators.pattern('^R\\$[0-9.]+,[0-9]{2}$'), value => Number(String(value.value ?? '').replace(/\D/g, '')) > 9999999 ? { stipendMax: true } : null]); } else { control.reset('', { emitEvent: false }); this.previousStipend = ''; control.clearValidators(); control.disable({ emitEvent: false }); } control.updateValueAndValidity({ emitEvent: false }); }
  formatStipend(): void {
    const control = this.form.controls.stipendAmount;
    const digits = (control.value || '').replace(/\D/g, '');
    const previousDigits = this.previousStipend.replace(/\D/g, '');
    if (digits.length > 7 && digits.length > previousDigits.length) {
      control.setValue(this.previousStipend, { emitEvent: false });
      return;
    }
    this.previousStipend = this.currency(digits);
    control.setValue(this.previousStipend, { emitEvent: false });
  }
  private currency(value: unknown): string { const cents = Number(value); if (!Number.isSafeInteger(cents) || cents <= 0) return ''; return `R$${Math.floor(cents / 100).toLocaleString('pt-BR')},${String(cents % 100).padStart(2, '0')}`; }
  file(event: Event): void { const selected = (event.target as HTMLInputElement).files?.[0]; if (selected) { this.document = selected; this.form.markAsDirty(); } }
  download(file: any): void { this.http.get(`${this.auth.api}/tces/${this.id}/documents/${file.id}/download`, { responseType: 'blob' }).subscribe({ next: blob => { const anchor = window.document.createElement('a'); anchor.href = URL.createObjectURL(blob); anchor.download = file.originalName; anchor.click(); URL.revokeObjectURL(anchor.href); }, error: response => this.error = response.error?.message || 'Não foi possível baixar o arquivo.' }); }
  hasUnsavedChanges(): boolean { return !this.saved && (this.form.dirty || Boolean(this.document)); }
  @HostListener('window:beforeunload', ['$event']) beforeUnload(event: BeforeUnloadEvent): void { preventUnloadWithUnsavedChanges(event, this.hasUnsavedChanges()); }
  save(): void { this.submitted = true; this.form.controls.startDate.updateValueAndValidity(); this.form.controls.endDate.updateValueAndValidity(); if (this.form.invalid || (!this.id && !this.document)) { this.error = 'Preencha os campos obrigatórios e selecione o PDF do TCE.'; return; } const data = new FormData(); Object.entries(this.form.getRawValue()).forEach(([key, value]) => data.append(key, typeof value === 'boolean' ? String(value) : value || '')); if (this.document) data.append('document', this.document); const request = this.id ? this.http.patch(`${this.auth.api}/tces/${this.id}`, data) : this.http.post(`${this.auth.api}/tces`, data); request.subscribe({ next: () => { this.saved = true; this.form.markAsPristine(); this.router.navigateByUrl('/tces'); }, error: response => this.error = response.error?.message || 'Não foi possível salvar.' }); }
}
