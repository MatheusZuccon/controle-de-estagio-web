import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { ConfirmationDialogService } from '../shared/confirmation-dialog.component';

export const UNSAVED_CHANGES_MESSAGE = 'As alterações não salvas serão perdidas. Deseja sair?';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const pendingChangesGuard: CanDeactivateFn<HasUnsavedChanges> = component =>
  !component.hasUnsavedChanges() || inject(ConfirmationDialogService).confirm({ title: 'Sair sem salvar?', message: UNSAVED_CHANGES_MESSAGE, confirmLabel: 'Sair sem salvar', cancelLabel: 'Continuar editando', danger: true });

export function preventUnloadWithUnsavedChanges(event: BeforeUnloadEvent, hasUnsavedChanges: boolean): void {
  if (!hasUnsavedChanges) return;
  event.preventDefault();
  event.returnValue = '';
}
