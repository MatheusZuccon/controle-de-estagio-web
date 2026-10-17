import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Inject, Input, Output } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  standalone: true,
  imports: [MatDialogModule],
  template: `
    <h2 mat-dialog-title>Foto do estagiário</h2>
    <mat-dialog-content><img [src]="src" alt="Foto do estagiário"></mat-dialog-content>
    <mat-dialog-actions align="end"><button type="button" (click)="dialogRef.close()">Fechar</button></mat-dialog-actions>
  `,
  styles: [`
    :host { display: block; font-family: Arial, sans-serif; }
    h2 { color: #203a54; font: 600 20px Arial, sans-serif; }
    mat-dialog-content { display: flex; justify-content: center; }
    img { display: block; max-width: 100%; max-height: 60vh; object-fit: contain; }
    mat-dialog-actions { padding: 16px 24px 24px; }
    button { min-height: 38px; padding: 0 16px; border: 1px solid #0d4f8b; border-radius: 4px; background: #0d4f8b; color: white; font: 600 13px Arial, sans-serif; cursor: pointer; }
    button:focus-visible { outline: 3px solid #77a9d4; outline-offset: 2px; }
  `],
})
export class PhotoPreviewDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public src: string, public dialogRef: MatDialogRef<PhotoPreviewDialogComponent>) {}
}

@Component({
  selector: 'app-photo-frame',
  standalone: true,
  imports: [CommonModule, MatMenuModule],
  template: `
    <input #photoInput type="file" accept="image/*" hidden (change)="selectPhoto($event)">
    <button type="button" class="frame" [attr.aria-label]="src ? (allowChange ? 'Opções da foto do estagiário' : 'Visualizar foto do estagiário') : (allowChange ? 'Adicionar foto do estagiário' : 'Sem foto cadastrada')" [disabled]="!src && !allowChange"
      [matMenuTriggerFor]="src && allowChange ? photoMenu : null" (click)="src && !allowChange ? viewPhoto() : (!src && allowChange && photoInput.click())">
      <img *ngIf="src; else placeholder" [src]="src" alt="">
      <ng-template #placeholder><span *ngIf="allowChange; else empty" class="plus" aria-hidden="true">+</span><ng-template #empty><span class="empty">Sem foto</span></ng-template></ng-template>
    </button>
    <mat-menu #photoMenu="matMenu" class="photo-action-menu">
      <button mat-menu-item type="button" (click)="viewPhoto()">Visualizar foto</button>
      <button mat-menu-item type="button" (click)="photoInput.click()">Alterar foto</button>
    </mat-menu>
  `,
  styles: [`
    :host { display: inline-block; }
    .frame { display: grid; place-items: center; width: 108px; aspect-ratio: 3 / 4; overflow: hidden; padding: 0; border: 1px dashed #a5b7c6; border-radius: 5px; background: #f8fafc; cursor: pointer; }
    .frame:focus-visible { outline: 3px solid #77a9d4; outline-offset: 2px; }
    .frame:hover { border-color: #0d4f8b; background: #f0f6fb; }
    img { display: block; width: 100%; height: 100%; object-fit: contain; }
    .frame:disabled { cursor: default; }
    .empty { color: #728496; font: 11px Arial, sans-serif; }
    .plus { display: grid; place-items: center; width: 36px; height: 36px; border: 1px solid #a5b7c6; border-radius: 50%; color: #0d4f8b; font: 300 26px/1 Arial, sans-serif; }
  `],
})
export class PhotoFrameComponent {
  @Input() src = '';
  @Input() allowChange = true;
  @Output() photoSelected = new EventEmitter<File>();
  constructor(private dialog: MatDialog) {}
  selectPhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.photoSelected.emit(file);
    input.value = '';
  }
  viewPhoto(): void {
    if (this.src) this.dialog.open(PhotoPreviewDialogComponent, { data: this.src, width: '560px', maxWidth: 'calc(100vw - 32px)', maxHeight: '90vh', autoFocus: 'button' });
  }
}
