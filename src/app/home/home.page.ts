import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AlertController } from '@ionic/angular';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  user: any = null;
  userData: any = {};
  scannedData: string = '';  // Propiedad para almacenar los datos escaneados

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private router: Router,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    // Verificar si hay un usuario autenticado
    this.afAuth.authState.subscribe((user) => {
      if (user) {
        this.user = user;
        this.loadUserData(user.uid);
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

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

  async logout() {
    const alert = await this.alertController.create({
      header: 'Confirmar Cierre de Sesión',
      message: '¿Estás seguro de que deseas cerrar sesión?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          handler: async () => {
            await this.afAuth.signOut();
            this.router.navigate(['/login']);
          }
        }
      ]
    });

    await alert.present();
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  goToSettings() {
    this.router.navigate(['/settings']);
  }

  // Función correcta para escanear QR
  async scanQRCode() {
    try {
      // Solicita permisos y habilita el escáner
      const status = await BarcodeScanner.checkPermission({ force: true });
      
      if (status.granted) {
        // Oculta la interfaz de la web mientras se escanea
        BarcodeScanner.hideBackground();

        // Inicia el escaneo del QR
        const result = await BarcodeScanner.startScan(); 

        if (result && result.hasContent) {
          this.scannedData = result.content;  // Guarda los datos escaneados
        }
        
        // Mostrar la interfaz de la web nuevamente
        BarcodeScanner.showBackground();
      } else {
        console.error('Permiso de cámara no concedido');
      }
    } catch (error) {
      console.error('Error al escanear el código QR:', error);
    }
  }
}
