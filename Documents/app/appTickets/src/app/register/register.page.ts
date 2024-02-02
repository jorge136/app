import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NavController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { Router } from '@angular/router';
@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {
  registerForm: FormGroup; validation_messages = {
    email: [
      { type: "required", message: "El Email es obligatorio." },
      { type: "pattern", message: "El Email ingresado no es valido." }
    ],
    password: [
      {type: "required", message: "La Contraseña es obligatoria."},
      {type: "minlength", message: "La contraseña debe contener minimo 8 caracteres."}
    ],
    confirmation_password: [
      {type: "required", message: "Las contraseñas no cinciden."},
      {type: "minlength", message: "Las contraseñas no coinciden."}
    ],
    name: [
      {type: "required", message: "El nombre es obligatorio."},
      {type: "maxlength", message: "El maximo de de caracteres es de 20."}
    ],
    last_name: [
      {type: "required", message: "El apellido es obligatorio."},
      {type: "maxlength", message: "El maximo de de caracteres es de 20."}
    ]
  }
  registerMessage: any;
  constructor(
    private router: Router,
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
          Validators.minLength(8)
        ])
      ),
      confirmation_password: new FormControl(
        "",
        Validators.compose([
          Validators.required,
          Validators.minLength(8)
        ])
      ),
      name: new FormControl(
        "",
        Validators.compose([
          Validators.required,
          Validators.maxLength(20)
        ])
      ),
      last_name: new FormControl(
        "",
        Validators.compose([
          Validators.required,
          Validators.maxLength(20)
        ])
      )
    })
    }
    goToHome(){
      console.log("go to home");
      this.router.navigateByUrl('/menu/home');
      this.storage.set('mostreLaIntro', true);
    }
  ngOnInit() {
  }

  register(register_data: any){
    console.log(register_data);
      this.storage.set('userRegisteredIn', true);
      this.navCtrl.navigateForward('/menu/home');
    }; 
  }

