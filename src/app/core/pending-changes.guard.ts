import { CanDeactivateFn } from '@angular/router';

export const UNSAVED_CHANGES_MESSAGE = 'As alterações não salvas serão perdidas. Deseja sair?';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const pendingChangesGuard: CanDeactivateFn<HasUnsavedChanges> = component =>
  !component.hasUnsavedChanges() || window.confirm(UNSAVED_CHANGES_MESSAGE);

export function preventUnloadWithUnsavedChanges(event: BeforeUnloadEvent, hasUnsavedChanges: boolean): void {
  if (!hasUnsavedChanges) return;
  event.preventDefault();
  event.returnValue = '';
}
