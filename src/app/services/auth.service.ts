// src/app/services/auth.service.ts

import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private afAuth: AngularFireAuth) { }

  // Método para obtener el ID del usuario actualmente autenticado
  getUserId(): Observable<string> {
    return new Observable((observer) => {
      this.afAuth.authState.subscribe(user => {
        if (user) {
          observer.next(user.uid);  // Devolver el ID del usuario
        } else {
          observer.next('');
        }
      });
    });
  }

  // Método de logout
  logout() {
    this.afAuth.signOut();  // Cerrar sesión
  }
}
