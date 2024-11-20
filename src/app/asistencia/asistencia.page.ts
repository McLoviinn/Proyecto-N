import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';  // Importar el servicio de Firestore

@Component({
  selector: 'app-asistencia',
  templateUrl: './asistencia.page.html',
  styleUrls: ['./asistencia.page.scss'],
})
export class AsistenciaPage implements OnInit {
  asistencias: any[] = [];  // Array para almacenar las asistencias

  constructor(private firestore: AngularFirestore) {}

  ngOnInit() {
    this.loadAsistencias();  // Cargar las asistencias cuando se inicializa la página
  }

  loadAsistencias() {
    this.firestore.collection('asistencia', ref => ref.orderBy('timestamp', 'desc')).snapshotChanges()
      .subscribe(data => {
        // Procesar los datos obtenidos de Firestore
        this.asistencias = data.map(e => {
          const docData = e.payload.doc.data();
          // Verifica que docData sea un objeto antes de usar el spread operator
          return docData ? {
            id: e.payload.doc.id,
            ...docData  // Utiliza spread operator solo si docData es un objeto
          } : null;
        }).filter(item => item !== null);  // Eliminar cualquier valor nulo
      }, error => {
        console.error('Error al cargar las asistencias:', error);
      });
  }
}
