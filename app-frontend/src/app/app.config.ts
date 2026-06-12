import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideCacheableAnimationLoader, provideLottieOptions } from 'ngx-lottie';
import player from 'lottie-web';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideIonicAngular(),
    provideRouter(routes), 
    provideClientHydration(), 
    provideLottieOptions({ player: () => player }),
    provideCacheableAnimationLoader(),
  ],
};
