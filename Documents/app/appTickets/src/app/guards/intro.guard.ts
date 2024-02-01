import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { Router } from "@angular/router";
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class IntroGuard implements CanActivate {

  constructor(
    private router: Router,
    private storage: Storage
  ) { }

  /**
   * Este método determina si la ruta puede ser activada.
   * @returns `true` si la ruta puede ser activada, `false` si no.
   */
  async canActivate(): Promise<boolean | UrlTree> {
    const mostreIntro = await this.storage.get('mostreLaIntro');

    if (mostreIntro) {
      console.log('Ya se mostró la intro. Permitiendo acceso.');
      return true;  // Permitir acceso a la ruta
    } else {
      console.log('No se mostró la intro. Redirigiendo a /intro.');
      return this.router.createUrlTree(['/intro']);  // Redirigir a la página de introducción
    }
  }
}

