// Importamos los módulos necesarios desde Angular
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Importamos el componente de la página de introducción
import { IntroPage } from './intro.page';

// Definimos las rutas para la página de introducción
const routes: Routes = [
  {
    path: '',
    component: IntroPage
  }
];

// Definimos el módulo de enrutamiento para la página de introducción
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class IntroPageRoutingModule {}
