import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-asistencia',
  templateUrl: './asistencia.page.html',
  styleUrls: ['./asistencia.page.scss'],
})
export class AsistenciaPage implements OnInit {
  user: any = null;
  asistencias: any[] = [];  // Aquí almacenaremos la lista de asistencias

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore
  ) {}

  ngOnInit() {
    // Suscribirse al estado de autenticación
    this.afAuth.authState.subscribe((user) => {
      if (user) {
        this.user = user;
        this.loadUserAttendance(user.uid);  // Cargar la asistencia del usuario
      } else {
        // Manejar el caso en que no haya un usuario logeado, redirigir si es necesario
      }
    });
  }

  // Función para cargar la asistencia del usuario desde Firestore
  loadUserAttendance(uid: string) {
    this.firestore.collection('users').doc(uid).collection('asistencia').valueChanges().subscribe((data: any[]) => {
      this.asistencias = data;  // Asignar los datos obtenidos a la variable asistencias
    });
  }
}