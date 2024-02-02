// Importa los módulos necesarios
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { NavController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  // Declara el formulario reactivo
  loginForm: FormGroup;
  // Define mensajes de validación
  validation_messages = {
    email: [
      { type: "required", message: "El Email es obligatorio." },
      { type: "pattern", message: "El Email ingresado no es valido." }
    ],
    password: [
      { type: "required", message: "La contraseña es obligatoria." },
      // Agrega tus propias reglas de validación para la contraseña según sea necesario
    ]
  };
  // Variable para mensajes de inicio de sesión
  loginMessage: any;

  // Constructor del componente
  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private navCtrl: NavController,
    private storage: Storage
  ) {
    // Inicializa el formulario con validadores
    this.loginForm = this.formBuilder.group({
      email: new FormControl(
        "",
        Validators.compose([
          Validators.required,
          Validators.pattern(
            "^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$"
          )
        ])
      ),
      password: new FormControl(
        "",
        Validators.compose([
          Validators.required,
          // Agrega tus propias reglas de validación para la contraseña según sea necesario
        ])
      )
    });
  }

  // Método del ciclo de vida de Angular (OnInit)
  ngOnInit() {}

  // Método para manejar el inicio de sesión
  login(login_data: any) {
    // Imprime los datos del formulario en la consola
    console.log(login_data);

    // Llama al servicio de inicio de sesión
    this.authService.loginUser(login_data).then(res => {
      // Almacena el mensaje de inicio de sesión
      this.loginMessage = res;
      
      // Almacena la información de inicio de sesión en el Storage (si es necesario)
      this.storage.set('userLoggedIn', true);
      
      // Redirige a la página de inicio después del inicio de sesión exitoso
      this.navCtrl.navigateForward('menu/home');
    }).catch(err => {
      // Maneja los errores del inicio de sesión
      this.loginMessage = err;
      console.error(err); // Imprime el error en la consola para depuración
    });
  }
}
