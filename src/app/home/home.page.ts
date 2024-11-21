import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';  // Importar el scanner
import { AlertController, MenuController } from '@ionic/angular'; // Importar MenuController y AlertController

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  user: any = null;
  userData: any = {};  
  scannedData: string = '';  // Aquí guardaremos los datos escaneados

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private router: Router,
    private alertController: AlertController, // Inyectar AlertController
    private menuController: MenuController // Inyectar MenuController
  ) {}

  ngOnInit() {
    this.afAuth.authState.subscribe((user) => {
      if (user) {
        this.user = user;
        this.loadUserData(user.uid);  // Cargar los datos específicos del usuario
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  // Función para cargar los datos específicos del usuario desde Firestore
  loadUserData(uid: string) {
    this.firestore.collection('users').doc(uid).valueChanges().subscribe(data => {
      if (data) {
        this.userData = data;  
      } else {
        this.userData = {
          email: this.user.email,
          name: 'Usuario',
        };
      }
    });
  }

  // Función para cerrar sesión con confirmación
  async logout() {
    const alert = await this.alertController.create({
      header: 'Confirmar Cierre de Sesión',
      message: '¿Estás seguro de que deseas cerrar sesión?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            // El usuario cancela, no se hace nada
          }
        },
        {
          text: 'Cerrar Sesión',
          handler: async () => {
            // El usuario confirma, cerrar sesión
            await this.afAuth.signOut();
            this.router.navigate(['/login']);
          }
        }
      ]
    });

    await alert.present();
  }

  // Función para iniciar el escaneo del código QR
  async scanQRCode() {
    try {
      // Inicializar el escaneo del QR
      await BarcodeScanner.prepare(); // Prepare the scanner
      const result = await BarcodeScanner.startScan();  // Start scanning

      if (result.hasContent) {
        this.scannedData = result.content;  // Asignamos los datos escaneados a la variable
        const formattedData = this.formatScannedData(this.scannedData);  // Formateamos los datos
        if (formattedData) {
          this.registerScannedData(formattedData);  // Registramos los datos
        }
      } else {
        console.log("No QR code found.");
      }

      // Detener el escaneo después de usarlo
      await BarcodeScanner.stopScan();
      await BarcodeScanner.hideBackground();  // Ocultar el fondo

    } catch (err) {
      console.error('Error while scanning QR code:', err);
    }
  }

  // Función para formatear los datos escaneados
  formatScannedData(scannedData: string): string | null {
    // Asumimos que los datos escaneados están en el formato correcto (ASIGNATURA|SECCION|SALA|FECHA)
    const parts = scannedData.split('|');
    
    // Validamos que la longitud de las partes es correcta
    if (parts.length === 4) {
      const asignatura = parts[0];
      const seccion = parts[1];
      const sala = parts[2];
      const fecha = parts[3];

      // Devuelve el formato solicitado
      return `${asignatura}|${seccion}|${sala}|${fecha}`;
    } else {
      console.error('Formato QR incorrecto');
      return null;
    }
  }

  // Función para registrar los datos escaneados
// Función para registrar los datos escaneados, ajustado para el usuario logeado
registerScannedData(data: string) {
  console.log('QR Data:', data); // Aquí puedes manejar los datos del QR

  // Verificar que el usuario esté logeado
  if (this.user && this.user.uid) {
    // Obtenemos la fecha y hora actual
    const timestamp = new Date();

    // Guardamos los datos en Firestore en la colección "asistencia", pero ahora dentro del documento del usuario logeado
    this.firestore.collection('users').doc(this.user.uid).collection('asistencia').add({
      qrData: data,  // Datos formateados
      timestamp: timestamp,  // Fecha y hora del escaneo
      formattedDate: timestamp.toISOString(),  // Fecha y hora en formato ISO
    }).then(() => {
      console.log('Datos registrados con éxito para el usuario:', this.user.uid);
    }).catch((error) => {
      console.error('Error al registrar los datos para el usuario:', error);
    });
  } else {
    console.error('No hay usuario logeado.');
  }
}

  // Funciones para navegar al perfil, horario y asistencia
  goToProfile() {
    this.router.navigate(['/perfil']);  // Navegar a la página de mi perfil
    this.menuController.close();  // Cerrar el menú
  }

  goToSchedule() {
    this.router.navigate(['/horario']);  // Navegar a la página de horario
    this.menuController.close();  // Cerrar el menú
  }

  goToAttendance() {
    this.router.navigate(['/asistencia']);  // Navegar a la página de asistencia
    this.menuController.close();  // Cerrar el menú
  }

  // Función para abrir el menú lateral
  openMenu() {
    this.menuController.open();  // Abrir el menú
  }
}
