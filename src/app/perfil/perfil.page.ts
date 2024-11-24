// src/app/perfil/perfil.page.ts

import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from '../services/auth.service';  // Asegúrate de tener un servicio de autenticación.

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
})
export class PerfilPage implements OnInit {

  user: any = {};  // Aquí almacenaremos los datos del perfil
  userId: string = '';  // ID del usuario actual

  constructor(
    private authService: AuthService,
    private firestore: AngularFirestore
  ) { }

  ngOnInit() {
    this.getUserData();  // Obtener los datos del usuario al cargar la página
  }

  // Método para obtener los datos del perfil del usuario
  getUserData() {
    this.authService.getUserId().subscribe(userId => {
      this.userId = userId;  // Obtener el ID del usuario actual desde el servicio de autenticación
      this.firestore.collection('users').doc(this.userId).collection('info').doc('profile')
        .valueChanges().subscribe(profileData => {
          if (profileData) {
            this.user = profileData;  // Asignar los datos del perfil al objeto 'user'
          }
        });
    });
  }

  // Método para cerrar sesión
  logout() {
    this.authService.logout();  // Implementa la lógica de logout en tu servicio
  }
}