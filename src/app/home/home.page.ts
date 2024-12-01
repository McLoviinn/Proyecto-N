import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { AlertController, MenuController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  user: any = null;
  userData: any = {};
  userName: string = ''; // Nueva propiedad para el nombre del usuario (antes del @)
  scannedData: string = '';
  currentCity: string = ''; 
  currentTemperature: string = '';
  weatherDescription: string = ''; 

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private router: Router,
    private alertController: AlertController,
    private menuController: MenuController
  ) {}

  ngOnInit() {
    this.afAuth.authState.subscribe((user) => {
      if (user) {
        this.user = user;
        this.loadUserData(user.uid);
        this.userName = user.email ? user.email.split('@')[0] : 'Usuario'; // Verificación de null/undefined
        this.getLocationAndWeather(); // Llamar a la función para obtener el clima y la ubicación
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
          handler: () => {}
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

  async scanQRCode() {
    try {
      await BarcodeScanner.prepare();
      const result = await BarcodeScanner.startScan();

      if (result.hasContent) {
        this.scannedData = result.content;
        const formattedData = this.formatScannedData(this.scannedData);
        if (formattedData) {
          this.registerScannedData(formattedData);
        }
      } else {
        console.log("No QR code found.");
      }

      await BarcodeScanner.stopScan();
      await BarcodeScanner.hideBackground();
    } catch (err) {
      console.error('Error while scanning QR code:', err);
    }
  }

  formatScannedData(scannedData: string): string | null {
    const parts = scannedData.split('|');
    if (parts.length === 4) {
      const asignatura = parts[0];
      const seccion = parts[1];
      const sala = parts[2];
      const fecha = parts[3];
      return `${asignatura}|${seccion}|${sala}|${fecha}`;
    } else {
      console.error('Formato QR incorrecto');
      return null;
    }
  }

  registerScannedData(data: string) {
    if (this.user && this.user.uid) {
      const timestamp = new Date();
      this.firestore.collection('users').doc(this.user.uid).collection('asistencia').add({
        qrData: data,
        timestamp: timestamp,
        formattedDate: timestamp.toISOString(),
      }).then(() => {
        console.log('Datos registrados con éxito para el usuario:', this.user.uid);
      }).catch((error) => {
        console.error('Error al registrar los datos para el usuario:', error);
      });
    } else {
      console.error('No hay usuario logeado.');
    }
  }

  goToProfile() {
    this.router.navigate(['/perfil']);
    this.menuController.close();
  }

  goToSchedule() {
    this.router.navigate(['/horario']);
    this.menuController.close();
  }

  goToAttendance() {
    this.router.navigate(['/asistencia']);
    this.menuController.close();
  }

  goToChat() {
    this.router.navigate(['/chat']); // Navega a la página del chat
    this.menuController.close(); // Cierra el menú después de navegar
  }  

  openMenu() {
    this.menuController.open();
  }

  async getLocationAndWeather() {
    try {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        const locationResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`);
        const locationData = await locationResponse.json();
        this.currentCity = locationData?.address?.city || 'Comuna desconocida';

        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
        const weatherData = await weatherResponse.json();

        this.currentTemperature = `${weatherData.current_weather.temperature}°C`;
        this.weatherDescription = this.getWeatherDescription(weatherData.current_weather.weathercode);
      }, (error) => {
        console.error('Error al obtener la ubicación:', error);
      });
    } catch (error) {
      console.error('Error al obtener el clima:', error);
    }
  }

  getWeatherDescription(code: number): string {
    switch (code) {
      case 0: return 'Clima claro';
      case 1: return 'Parcialmente nublado';
      case 2: return 'Nublado';
      case 3: return 'Lluvia ligera';
      case 4: return 'Lluvia moderada';
      case 5: return 'Lluvia fuerte';
      case 6: return 'Tormenta';
      case 7: return 'Nieve ligera';
      case 8: return 'Nieve moderada';
      case 9: return 'Nieve fuerte';
      default: return 'Clima desconocido';
    }
  }
}
