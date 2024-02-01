// menu.page.ts

import { Component, OnInit } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { NavController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';


@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
})
export class MenuPage implements OnInit {
  event_list: any[] = [  // Debes ajustar esta estructura según tu modelo de datos
    { name: 'Evento 1', date: '2024-02-01', location: 'Ubicación 1', image: 'imagen1.jpg' },
    { name: 'Evento 2', date: '2024-02-02', location: 'Ubicación 2', image: 'imagen2.jpg' },
    // Agrega más eventos según sea necesario
  ];

  constructor(
    private menu: MenuController,
    private navCtrl: NavController,
    private storage: Storage
  ) { }

  ngOnInit() {
  }

  closeMenu() {
    console.log("cerrar menu");
    this.menu.close();
  }

  logout() {
    this.navCtrl.navigateRoot("/login");
  }

  goToHome() {
    this.storage.set("volverAlHome", true)
    this.navCtrl.navigateRoot("menu/home");
  }

}
