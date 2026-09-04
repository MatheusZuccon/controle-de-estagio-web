import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styleUrl: './tce-form.component.scss',
  template: `
    <main class="form-page">
      <header class="app-header">
        <div class="brand"><b>FT</b><span>FAETERJ Petrópolis — Sistema de Gestão de Estágios</span></div>
        <button type="button" class="exit" (click)="router.navigateByUrl('/tces')">Sair</button>
      </header>
      <section class="page-heading">
        <div><p class="eyebrow">CONTROLE DE DOCUMENTOS</p><h1>{{ id ? 'Editar' : 'Cadastrar' }} TCE</h1><p>Preencha os dados do Termo de Compromisso de Estágio.</p></div>
        <button type="button" class="back" (click)="router.navigateByUrl('/tces')">← Voltar para a lista</button>
      </section>
      <form [formGroup]="form" (ngSubmit)="save()" novalidate>
        <section class="form-section">
          <div class="section-title"><span>Dados do TCE</span><small>Campos com <strong>*</strong> são obrigatórios</small></div>
          <div class="form-grid">
            <div class="field number-field"><label for="number">Número do TCE <em>*</em></label><input id="number" formControlName="number" maxlength="20" autocomplete="off"></div>
            <div class="field company-field"><label for="company">Empresa concedente <em>*</em></label><input id="company" formControlName="companyName" autocomplete="organization"></div>
            <div class="field"><label for="enrollment">Matrícula <em>*</em></label><input id="enrollment" formControlName="enrollment" maxlength="13" autocomplete="off"></div>
            <div class="field student-field"><label for="studentName">Nome do estagiário <em>*</em></label><input id="studentName" formControlName="studentName" autocomplete="name"></div>
            <div class="field"><label for="email">E-mail institucional <em>*</em></label><input id="email" type="email" formControlName="email" autocomplete="email"></div>
            <div class="field"><label for="phone">Telefone celular <em>*</em></label><input id="phone" formControlName="phone" placeholder="(00) 00000-0000" autocomplete="tel"></div>
            <div class="field"><label for="startDate">Início do estágio <em>*</em></label><input id="startDate" type="date" formControlName="startDate"></div>
            <div class="field"><label for="endDate">Término do estágio <em>*</em></label><input id="endDate" type="date" formControlName="endDate"></div>
          </div>
        </section>
        <section class="form-section attachments">
          <div class="section-title"><span>Anexos</span><small>O documento do TCE deve estar em PDF.</small></div>
          <div class="upload-grid">
            <div class="upload required"><label for="document">Documento do TCE <em>*</em></label><div class="current-file" *ngIf="existingDocument"><span>Arquivo atual: <b>{{ existingDocument.originalName }}</b></span><button type="button" (click)="download(existingDocument)">Baixar</button></div><input id="document" type="file" accept="application/pdf" (change)="file($event, 'document')"><small>{{ document ? 'Novo arquivo selecionado: ' + document.name : existingDocument ? 'Selecione outro PDF somente se desejar substituí-lo.' : 'Nenhum arquivo selecionado' }}</small></div>
            <div class="upload"><label for="photo">Foto do estagiário <span>opcional</span></label><div class="current-file" *ngIf="existingPhoto"><span>Arquivo atual: <b>{{ existingPhoto.originalName }}</b></span><button type="button" (click)="download(existingPhoto)">Baixar</button></div><input id="photo" type="file" accept="image/*" (change)="file($event, 'photo')"><small>{{ photo ? 'Nova foto selecionada: ' + photo.name : existingPhoto ? 'Selecione outra imagem somente se desejar substituí-la.' : 'Nenhum arquivo selecionado' }}</small></div>
          </div>
        </section>
        <p class="error" *ngIf="error">{{ error }}</p>
        <footer class="form-actions"><button type="button" class="secondary" (click)="router.navigateByUrl('/tces')">Cancelar</button><button type="submit" class="primary" [disabled]="!canSave">Salvar TCE</button></footer>
      </form>
    </main>
  `
})
export class TceFormComponent implements OnInit {
  id = '';
  document?: File;
  photo?: File;
  existingDocument?: any;
  existingPhoto?: any;
  error = '';
  form = this.fb.group({ number: ['', [Validators.required, Validators.maxLength(20)]], enrollment: ['', [Validators.required, Validators.maxLength(13)]], studentName: ['', Validators.required], email: ['', [Validators.required, Validators.email]], phone: ['', Validators.required], companyName: ['', Validators.required], startDate: ['', Validators.required], endDate: ['', Validators.required] });

  constructor(private fb: FormBuilder, private route: ActivatedRoute, public router: Router, private http: HttpClient, private auth: AuthService) {}
  get canSave(): boolean { return this.form.valid && (Boolean(this.id) || Boolean(this.document)); }
  ngOnInit(): void { this.id = this.route.snapshot.paramMap.get('id') || ''; if (this.id) this.http.get<any>(`${this.auth.api}/tces/${this.id}`).subscribe(tce => { this.existingDocument = tce.documents?.find((file: any) => file.type === 'TCE_PDF'); this.existingPhoto = tce.documents?.find((file: any) => file.type === 'STUDENT_PHOTO'); this.form.patchValue({ number: tce.number, enrollment: tce.studentEnrollment, studentName: tce.studentName, email: tce.studentEmail, phone: tce.studentPhone, companyName: tce.company.name, startDate: tce.startDate.slice(0, 10), endDate: tce.endDate.slice(0, 10) }); }); }
  file(event: Event, kind: 'document' | 'photo'): void { const selected = (event.target as HTMLInputElement).files?.[0]; if (selected) this[kind] = selected; }
  download(file: any): void { this.http.get(`${this.auth.api}/tces/${this.id}/documents/${file.id}/download`, { responseType: 'blob' }).subscribe({ next: blob => { const anchor = window.document.createElement('a'); anchor.href = URL.createObjectURL(blob); anchor.download = file.originalName; anchor.click(); URL.revokeObjectURL(anchor.href); }, error: response => this.error = response.error?.message || 'Não foi possível baixar o arquivo.' }); }
  save(): void { if (this.form.invalid || (!this.id && !this.document)) { this.error = 'Preencha os campos obrigatórios e selecione o PDF do TCE.'; return; } const data = new FormData(); Object.entries(this.form.getRawValue()).forEach(([key, value]) => data.append(key, value || '')); if (this.document) data.append('document', this.document); if (this.photo) data.append('photo', this.photo); const request = this.id ? this.http.patch(`${this.auth.api}/tces/${this.id}`, data) : this.http.post(`${this.auth.api}/tces`, data); request.subscribe({ next: () => this.router.navigateByUrl('/tces'), error: response => this.error = response.error?.message || 'Não foi possível salvar.' }); }
}
