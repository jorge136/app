import { Component, OnInit } from '@angular/core';
@Component({
  selector: 'app-intro',
  templateUrl: './intro.page.html',
  styleUrls: ['./intro.page.scss'],
})
export class IntroPage  {
  slides = [
    {
      
      title: "Boletería en tu Mano",
      description: "Bienvenido a la aplicación de boletería BoletoBlink. Aquí puedes acceder y comprar boletos para una variedad de eventos emocionantes.",
      image: "assets/Blanco Negro Escrito a Mano Amor en Fondo Lienzo.png",
      help_text: "Explora nuestra plataforma para descubrir eventos destacados y compra tus boletos de manera fácil y segura.",
      class: "slide-1 red-title"
    },
    {
      title: "Descubre Nuevos Eventos",
      description: "Con BoletoBlink, puedes descubrir una amplia gama de eventos, desde conciertos y festivales hasta conferencias y espectáculos deportivos.",
      image: "assets/descarga.jpeg",
      help_text: "Explora la variedad de eventos disponibles y encuentra experiencias únicas para disfrutar con amigos y familiares.",
      class: ""
    },
    {
      title: "BoletoBlink Cloud",
      description: "Nuestra plataforma en la nube, BoletoBlink Cloud, te permite gestionar y escalar tus eventos, brindando servicios integrados como notificaciones push, construcción nativa y autenticación de usuarios.",
      image: "C:\\Users\\Jorge%20M%20De%20La%20Peña\\OneDrive\\Escritorio\\ionic-apps\\app-BoletosBlink\\src\\assets\\Screenshot%202024-01-22%201429.png",
      help_text: "Para obtener más detalles sobre BoletoBlink y sus servicios, visita <a href='https://www.tuboleta.com/'>nuestra documentación</a>.",
      class: "slide-3"
    }
    
    
    
  ];


  constructor() { }

  ionViewDidEnter() {
    console.log("Ya entre y vi la intro");
    // Vamos a guardar en el storage que ya vio la intro
  }

}