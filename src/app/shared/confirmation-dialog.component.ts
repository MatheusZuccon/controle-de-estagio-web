import { Component, Inject, Injectable } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { map } from 'rxjs';

export type ConfirmationData = { title: string; message: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean };

@Component({
  standalone: true,
  imports: [MatDialogModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button type="button" class="cancel" (click)="dialogRef.close(false)">{{ data.cancelLabel || 'Voltar' }}</button>
      <button type="button" class="confirm" [class.danger]="data.danger" (click)="dialogRef.close(true)">{{ data.confirmLabel || 'Confirmar' }}</button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host { display: block; font-family: Arial, sans-serif; }
    h2 { color: #203a54; font: 600 20px Arial, sans-serif; }
    mat-dialog-content { color: #4d5965; font: 14px/1.5 Arial, sans-serif; }
    mat-dialog-actions { gap: 10px; padding: 16px 24px 24px; }
    button { min-height: 38px; padding: 0 16px; border-radius: 4px; font: 600 13px Arial, sans-serif; cursor: pointer; }
    .cancel { border: 1px solid #8d949b; background: #fff; color: #20262c; }
    .confirm { border: 1px solid #062b4b; background: #062b4b; color: #fff; }
    .confirm.danger { border-color: #a3211b; background: #a3211b; }
    button:focus-visible { outline: 3px solid #77a9d4; outline-offset: 2px; }
  `],
})
export class ConfirmationDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: ConfirmationData, public dialogRef: MatDialogRef<ConfirmationDialogComponent, boolean>) {}
}

@Injectable({ providedIn: 'root' })
export class ConfirmationDialogService {
  constructor(private dialog: MatDialog) {}
  confirm(data: ConfirmationData) {
    return this.dialog.open(ConfirmationDialogComponent, { data, width: '440px', maxWidth: 'calc(100vw - 32px)', autoFocus: '.cancel', closeOnNavigation: false }).afterClosed().pipe(map(result => result === true));
  }
}
