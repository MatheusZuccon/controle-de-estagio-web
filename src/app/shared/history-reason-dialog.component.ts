import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  standalone: true,
  imports: [MatDialogModule],
  template: `
    <header class="dialog-header">
      <h2 mat-dialog-title>Justificativa</h2>
    </header>
    <mat-dialog-content class="dialog-content">
      <textarea aria-label="Justificativa" [value]="reason" readonly rows="7"></textarea>
    </mat-dialog-content>
    <mat-dialog-actions align="end"><button type="button" (click)="dialogRef.close()">Fechar</button></mat-dialog-actions>
  `,
  styles: [`
    :host { display: block; font-family: Arial, sans-serif; }
    .dialog-header { padding: 24px 24px 18px; border-top: 4px solid #0d4f8b; border-bottom: 1px solid #e1e6ea; }
    h2[mat-dialog-title] { margin: 0; padding: 0; color: #203a54; font: 600 20px/1.25 Arial, sans-serif; }
    mat-dialog-content.dialog-content { padding: 24px; overflow-y: auto; }
    textarea { box-sizing: border-box; display: block; width: 100%; min-height: 180px; padding: 16px; border: 1px solid #c6d0d9; border-radius: 4px; background: #f8fafc; color: #26313d; font: 14px/1.5 Arial, sans-serif; resize: none; overflow-wrap: anywhere; }
    mat-dialog-actions { padding: 16px 24px 24px; border-top: 1px solid #e1e6ea; }
    button { min-height: 38px; padding: 0 16px; border: 1px solid #0d4f8b; border-radius: 4px; background: #0d4f8b; color: #fff; font: 600 13px Arial, sans-serif; cursor: pointer; }
    button:focus-visible, textarea:focus-visible { outline: 3px solid #77a9d4; outline-offset: 2px; }
  `],
})
export class HistoryReasonDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public reason: string, public dialogRef: MatDialogRef<HistoryReasonDialogComponent>) {}
}
