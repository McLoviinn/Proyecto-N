import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, DocumentData } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-asistencia',
  templateUrl: './asistencia.page.html',
  styleUrls: ['./asistencia.page.scss'],
})
export class AsistenciaPage implements OnInit {
  asistencias: any[] = [];
  userId: string | null = null;
  loading: boolean = true; // Indicador de carga

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore
  ) {}

  ngOnInit() {
    this.afAuth.authState.subscribe((user) => {
      if (user) {
        this.userId = user.uid;
        this.loadAsistencias();
      }
    });
  }

  async loadAsistencias() {
    this.loading = true; // Mostrar el indicador de carga
    if (!this.userId) {
      console.error('Usuario no autenticado.');
      this.loading = false;
      return;
    }

    try {
      const sectionsSnapshot = await this.firestore
        .collection(`users/${this.userId}/asistencia/asis/secciones`)
        .get()
        .toPromise();

      if (!sectionsSnapshot || sectionsSnapshot.empty) {
        console.warn('No se encontraron secciones.');
        this.asistencias = [];
        this.loading = false;
        return;
      }

      const asistenciasPromises: Promise<any[]>[] = [];

      sectionsSnapshot.forEach((sectionDoc) => {
        const sectionId = sectionDoc.id;

        const registrosPromise = this.firestore
          .collection(`users/${this.userId}/asistencia/asis/secciones/${sectionId}/registros`)
          .get()
          .toPromise()
          .then((registrosSnapshot) => {
            if (registrosSnapshot && !registrosSnapshot.empty) {
              return registrosSnapshot.docs.map((registroDoc) => {
                const data = registroDoc.data() as DocumentData;
                const timestamp = data['timestamp'] 
                  ? data['timestamp'].toDate()
                  : null; 
                return {
                  sectionId,
                  ...data, 
                  fecha: timestamp
                    ? timestamp.toLocaleDateString('es-ES')
                    : 'Fecha no disponible',
                  hora: timestamp
                    ? timestamp.toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Hora no disponible',
                };
              });
            }
            return [];
          });

        asistenciasPromises.push(registrosPromise);
      });

      const asistenciasArray = await Promise.all(asistenciasPromises);
      this.asistencias = asistenciasArray.reduce((acc, val) => acc.concat(val), []); 
    } catch (error) {
      console.error('Error al cargar las asistencias:', error);
    } finally {
      this.loading = false; 
    }
  }
}