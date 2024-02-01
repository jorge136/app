import { Injectable } from '@angular/core';
import * as dataEvents from "./events.json";
@Injectable({
  providedIn: 'root'
})
export class EventsService {
  urlServer ="http://190.131.209.106";
  constructor() { }

  getEvents(){
    return fetch(`${this.urlServer}/events`).then(
      response => response.json()
    );
  }

  getLocalEvents(){
    return dataEvents;
  }

  //Obtener categorias " get hacia /categories "
  //Obtener 1 categoria " get hacia /categories/:id"
  
}