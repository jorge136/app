// Importamos los módulos necesarios desde Angular y RxJS
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { Storage } from '@ionic/storage-angular';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {

  // Inyectamos el servicio de almacenamiento y el router en el guard
  constructor(
    private storage: Storage,
    private router: Router
  ){}

  // Implementamos la interfaz CanActivate
  async canActivate(): Promise<boolean | UrlTree> {

    // Verificamos si el usuario ha iniciado sesión obteniendo el valor desde el almacenamiento
    const userLoggedIn = await this.storage.get('userLoggedIn');

    if(userLoggedIn){
      // Si el usuario está logueado, permitimos la navegación
      console.log(userLoggedIn);
      console.log('El usuario está logueado');
      return true;
    } else {
      // Si el usuario no está logueado, redirigimos a la página de login y bloqueamos la navegación
      console.log('El usuario no está logueado');
      this.router.navigateByUrl('/login');
      return false;
    }
  }
}
