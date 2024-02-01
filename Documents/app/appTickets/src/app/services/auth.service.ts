import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() { }

  loginUser(credential: any){
    return new Promise((accept, reject) => {
      if(
        credential.email == '3126364249z@gmail.com' 
        //&& credential.password == '12345'
        ){
        accept('Login correcto');
      }else{
        reject('Login incorrecto');
      }
    });
  }

  registerUser(){
    //TODO
  }
}