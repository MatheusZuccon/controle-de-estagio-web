import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const profileCompleteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isCoordinator || auth.profileCompleted ? true : inject(Router).createUrlTree(['/student-profile']);
};
