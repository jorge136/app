import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { NavController } from '@ionic/angular'; // Agrega esta importación
import { Router } from '@angular/router';
@Component({
  selector: 'app-intro',
  templateUrl: './intro.page.html',
  styleUrls: ['./intro.page.scss'],
})
export class IntroPage implements OnInit {

  slides = [
    {
      title: "Bienvenido a la Experiencia Futbolística",
      image: "assets/bienveido.png",
      help_text: "Descubre una nueva forma de experimentar el fútbol. ¡Compra tus boletos ahora!",
      class: "slide-1 red-title"
    },
    {
      title: "Explora los Mejores Eventos",
      description: "Descubre los partidos más emocionantes, desde encuentros locales hasta competiciones internacionales.",
      image: "assets/explorer.webp",
      help_text: "Explora nuestra amplia selección de eventos de fútbol y encuentra tus favoritos.",
      class: ""
    },
    {
      title: "Compra tus Boletos",
      description: "Asegura tu lugar para vivir la pasión del fútbol. ¡Compra tus boletos de manera fácil y segura!",
      image: "assets/entradas.webp",
      help_text: "Disfruta de la comodidad de comprar boletos en línea y prepárate para el partido.",
      class: "slide-3"
    },
    {
      title: "Únete a la Emoción",
      description: "Conviértete en parte de la comunidad apasionada del fútbol. ¡No te pierdas ni un momento!",
      image: "assets/tickets.png",
      help_text: "Únete a nosotros y comparte la emoción del fútbol con aficionados de todo el mundo.",
    },
  ];

  constructor(
    private router: Router,
    private storage: Storage,
    private navCtrl: NavController,  // Asegúrate de inyectar NavController aquí
  ) { }

  ngOnInit() {
    // ...
  }

  ionViewDidEnter() {
    console.log("Ya entre y vi la intro");
  }

  goToHome(){
    console.log("go to home");
    this.router.navigateByUrl('menu/home');
    this.storage.set('mostreLaIntro', true);
  }
}