import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';  // Importar el scanner
import { AlertController } from '@ionic/angular'; // Importar AlertController

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
    private alertController: AlertController // Inyectar AlertController
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
        this.registerScannedData(this.scannedData);  // Registramos los datos
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

  // Función para registrar los datos escaneados
  registerScannedData(data: string) {
    console.log('QR Data:', data); // Aquí puedes manejar los datos del QR
    // Puedes hacer lo que quieras con los datos, por ejemplo, guardarlos en Firestore
    this.firestore.collection('scanned-data').add({
      qrData: data,
      timestamp: new Date(),
    }).then(() => {
      console.log('Datos registrados con éxito.');
    }).catch((error) => {
      console.error('Error al registrar los datos:', error);
    });
  }
}
