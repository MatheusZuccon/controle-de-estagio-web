import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, HostListener, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatError } from '@angular/material/form-field';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { HasUnsavedChanges, preventUnloadWithUnsavedChanges } from '../../core/pending-changes.guard';
import { AppHeaderComponent } from '../../shared/app-header.component';

@Component({ standalone: true, imports: [CommonModule, ReactiveFormsModule, MatError, AppHeaderComponent], styleUrl: './student-profile.component.scss', templateUrl: './student-profile.component.html' })
export class StudentProfileComponent implements OnInit, HasUnsavedChanges {
  readonly course = 'Tecnologia da Informação e Comunicação - TIC';
  readonly periods = ['1', '2', '3', '4', '5'];
  readonly internshipTypes = [['SUPERVISIONADO', 'Supervisionado'], ['VOLUNTARIO', 'Voluntário'], ['OUTRO', 'Outro']] as const;
  readonly educationLevels = [['FUNDAMENTAL_INCOMPLETO', 'Fundamental incompleto'], ['FUNDAMENTAL_COMPLETO', 'Fundamental completo'], ['MEDIO_INCOMPLETO', 'Médio incompleto'], ['MEDIO_COMPLETO', 'Médio completo'], ['SUPERIOR_INCOMPLETO', 'Superior incompleto'], ['SUPERIOR_COMPLETO', 'Superior completo']] as const;
  photo?: File; photoPreview = ''; error = ''; submitted = false; saved = false;
  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]], enrollment: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(16), Validators.pattern('^[0-9]+$')]], socialName: ['', Validators.maxLength(150)], birthDate: ['', [Validators.required, this.minimumAgeValidator]], gender: ['', Validators.maxLength(100)],
    phone: ['', [Validators.required, Validators.minLength(14), Validators.maxLength(15)]], address: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]], postalCode: ['', [Validators.required, Validators.pattern('^[0-9]{5}-[0-9]{3}$')]], neighborhood: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]], city: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]], state: ['', [Validators.required, Validators.pattern('^[A-Z]{2}$')]],
    course: ['', Validators.required], identity: ['', [Validators.required, Validators.maxLength(50)]], cpf: ['', [Validators.required, this.cpfValidator]], academicPeriod: ['', Validators.required], educationLevel: ['', Validators.required], internshipType: ['', Validators.required],
  });
  constructor(private fb: FormBuilder, private http: HttpClient, public auth: AuthService, public router: Router) {}
  showError(field: string): boolean { const control = this.form.get(field); return Boolean(control?.invalid && (control.touched || control.dirty || this.submitted)); }
  errorMessage(field: string): string { const errors = this.form.get(field)?.errors || {}; const labels: Record<string, string> = { name: 'Nome', enrollment: 'Matrícula', birthDate: 'Nascimento', phone: 'Telefone celular', address: 'Endereço', postalCode: 'CEP', neighborhood: 'Bairro', city: 'Cidade', state: 'UF', course: 'Curso', identity: 'Identidade', cpf: 'CPF', academicPeriod: 'Período/Módulo', educationLevel: 'Nível de escolaridade', internshipType: 'Tipo de estágio' }; if (errors.required) return `${labels[field]} é obrigatório.`; if (errors.minimumAge) return 'O estagiário deve ter no mínimo 16 anos.'; if (errors.cpf) return 'Informe um CPF válido.'; if (errors.pattern) return field === 'postalCode' ? 'Informe um CEP válido.' : field === 'state' ? 'Informe uma UF válida.' : 'Valor inválido.'; if (errors.minlength) return `${labels[field]} deve ter ao menos ${errors.minlength.requiredLength} caracteres.`; if (errors.maxlength) return `${labels[field]} excede o tamanho permitido.`; return 'Valor inválido.'; }
  ngOnInit(): void {
    if (!this.auth.isStudent) { this.router.navigateByUrl('/inicio'); return; }
    this.http.get<any>(`${this.auth.api}/students/me`).subscribe({ next: profile => {
      this.form.patchValue({ ...profile, birthDate: profile.birthDate?.slice(0, 10), postalCode: this.cep(profile.postalCode), cpf: this.cpf(profile.cpf), state: profile.state || '' });
      if (profile.photoAvailable) this.http.get(`${this.auth.api}/students/me/photo`, { responseType: 'blob' }).subscribe(blob => this.photoPreview = URL.createObjectURL(blob));
    }, error: response => this.error = response.error?.message || 'Não foi possível carregar o cadastro.' });
  }
  digitsOnly(field: 'enrollment'): void { const control = this.form.controls[field]; control.setValue((control.value || '').replace(/\D/g, ''), { emitEvent: false }); }
  formatPhone(): void { const control = this.form.controls.phone; const digits = (control.value || '').replace(/\D/g, '').slice(0, 11); const formatted = digits.length <= 2 ? (digits ? `(${digits}` : '') : digits.length <= 6 ? `(${digits.slice(0, 2)}) ${digits.slice(2)}` : `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`; control.setValue(formatted, { emitEvent: false }); }
  formatCep(): void { const control = this.form.controls.postalCode; control.setValue(this.cep(control.value), { emitEvent: false }); }
  formatCpf(): void { const control = this.form.controls.cpf; control.setValue(this.cpf(control.value), { emitEvent: false }); }
  formatState(): void { const control = this.form.controls.state; control.setValue((control.value || '').replace(/[^a-z]/gi, '').slice(0, 2).toUpperCase(), { emitEvent: false }); }
  selectPhoto(event: Event): void { const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return; this.photo = file; this.photoPreview = URL.createObjectURL(file); this.form.markAsDirty(); }
  hasUnsavedChanges(): boolean { return !this.saved && (this.form.dirty || Boolean(this.photo)); }
  @HostListener('window:beforeunload', ['$event']) beforeUnload(event: BeforeUnloadEvent): void { preventUnloadWithUnsavedChanges(event, this.hasUnsavedChanges()); }
  save(): void { this.submitted = true; if (this.form.invalid) { this.error = 'Preencha corretamente todos os campos obrigatórios.'; return; } const data = new FormData(); Object.entries(this.form.getRawValue()).forEach(([key, value]) => data.append(key, value || '')); if (this.photo) data.append('photo', this.photo); this.http.put<any>(`${this.auth.api}/students/me`, data).subscribe({ next: profile => { this.saved = true; this.form.markAsPristine(); this.auth.setProfileCompleted(profile.profileCompleted); this.router.navigateByUrl('/inicio'); }, error: response => this.error = response.error?.message || 'Não foi possível salvar o cadastro.' }); }
  private cep(value: unknown): string { const digits = String(value || '').replace(/\D/g, '').slice(0, 8); return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits; }
  private cpf(value: unknown): string { const digits = String(value || '').replace(/\D/g, '').slice(0, 11); return digits.length <= 3 ? digits : digits.length <= 6 ? `${digits.slice(0, 3)}.${digits.slice(3)}` : digits.length <= 9 ? `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}` : `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`; }
  private minimumAgeValidator(control: AbstractControl): ValidationErrors | null { const value = String(control.value || ''); if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return { minimumAge: true }; const [year, month, day] = value.split('-').map(Number); const birthDate = new Date(year, month - 1, day); const today = new Date(); let age = today.getFullYear() - birthDate.getFullYear(); if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) age -= 1; return age >= 16 ? null : { minimumAge: true }; }
  private cpfValidator(control: AbstractControl): ValidationErrors | null { const cpf = String(control.value || '').replace(/\D/g, ''); if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return { cpf: true }; const digit = (length: number) => { const sum = cpf.slice(0, length).split('').reduce((total, item, index) => total + Number(item) * (length + 1 - index), 0); const value = (sum * 10) % 11; return value === 10 ? 0 : value; }; return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]) ? null : { cpf: true }; }
}
