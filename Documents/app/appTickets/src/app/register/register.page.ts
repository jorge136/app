import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NavController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {
  registerForm: FormGroup; // declarar la propiedad registerForm
  // mensajes de validación y respuesta de registro
  registerMessage: string = ''; // agregar variable para mensajes de registro

  constructor(
    private formBuilder: FormBuilder,
    private navCtrl: NavController,
    private storage: Storage
  ) { 
    this.registerForm = this.formBuilder.group({
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
          // Puedes agregar más validadores según tus requisitos
        ])
      ),
      confirmation_password: new FormControl(
        "",
        Validators.compose([
          Validators.required,
          // Puedes agregar más validadores según tus requisitos
        ])
      ),
      name: new FormControl(
        "",
        Validators.compose([
          Validators.required,
          // Puedes agregar más validadores según tus requisitos
        ])
      ),
      last_name: new FormControl(
        "",
        Validators.compose([
          // Puedes agregar más validadores según tus requisitos
        ])
      )
    });
  }

  ngOnInit() {}

  register(register_data: any) {
    console.log(register_data);

    // Agregar lógica de registro aquí
    // Por ejemplo, podrías llamar a un servicio de registro

    // Simulando un mensaje de éxito para propósitos de demostración
    this.registerMessage = '¡Registro exitoso!';
  }

  goToLogin() {
    this.navCtrl.navigateBack('/login');
  }
}
