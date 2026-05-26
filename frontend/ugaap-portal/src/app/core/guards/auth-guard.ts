// import { inject } from '@angular/core';
// import { CanActivateFn, Router } from '@angular/router';
// import { SessionService } from '../services/session.service';

// export const authGuard: CanActivateFn = (route, state) => {
//   const session = inject(SessionService);
//   const router  = inject(Router);

//   if (session.isLoggedIn() && !session.isTokenExpired()) {
//     return true;
//   }

//   // Preserve the attempted URL so we can redirect back after login
//   return router.createUrlTree(['/auth/login'], {
//     queryParams: { returnUrl: state.url },
//   });
// };
