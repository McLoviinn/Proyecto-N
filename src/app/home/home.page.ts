import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { AlertController, MenuController } from '@ionic/angular';
import firebase from 'firebase/compat/app';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  user: any = null;
  userData: any = {};
  userName: string = '';
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
        this.userName = user.email ? user.email.split('@')[0] : 'Usuario';
        this.getLocationAndWeather();
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  loadUserData(uid: string) {
    this.firestore.collection('users').doc(uid).valueChanges().subscribe((data) => {
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
          handler: () => {},
        },
        {
          text: 'Cerrar Sesión',
          handler: async () => {
            await this.afAuth.signOut();
            this.router.navigate(['/login']);
          },
        },
      ],
    });

    await alert.present();
  }

  async scanQRCode() {
    try {
      await BarcodeScanner.prepare();
      const result = await BarcodeScanner.startScan();

      if (result.hasContent) {
        console.log('Contenido del QR escaneado:', result.content);
        const qrData = result.content;
        const [asignatura, seccion, sala, fecha] = qrData.split('|');

        const sectionId = `${asignatura.trim()}_${seccion.trim()}`;
        console.log('ID construido para buscar en Firestore:', sectionId);

        if (!this.user?.uid) {
          console.error('Usuario no autenticado.');
          await this.showAlert('Error', 'No se pudo autenticar al usuario.');
          return;
        }

        const sectionRef = this.firestore
          .collection('users')
          .doc(this.user.uid)
          .collection('asistencia')
          .doc('asis')
          .collection('secciones')
          .doc(sectionId);

        const sectionSnap = await sectionRef.get().toPromise();

        if (sectionSnap && sectionSnap.exists) {
          console.log('Sección válida encontrada:', sectionSnap.data());
          this.registerAttendance(asignatura.trim(), seccion.trim(), sala.trim(), fecha.trim());
        } else {
          await this.showAlert('Error', 'La sección escaneada no existe en el sistema.');
        }
      } else {
        console.log('No se pudo leer el QR.');
      }

      await BarcodeScanner.stopScan();
      await BarcodeScanner.hideBackground();
    } catch (err) {
      console.error('Error al escanear QR:', err);
      await BarcodeScanner.stopScan();
      await BarcodeScanner.hideBackground();
    }
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
    await alert.onDidDismiss();
  }

  async registerAttendance(asignatura: string, seccion: string, sala: string, fecha: string) {
    const userId = this.user?.uid;
    if (!userId) {
      console.error('Usuario no autenticado.');
      return;
    }

    console.log('Intentando registrar asistencia para:', { asignatura, seccion, sala, fecha });

    const attendanceRef = this.firestore
      .collection('users')
      .doc(userId)
      .collection('asistencia')
      .doc('asis')
      .collection('secciones')
      .doc(`${asignatura}_${seccion}`)
      .collection('registros', (ref) => ref.where('fecha', '==', fecha));

    const attendanceSnap = await attendanceRef.get().toPromise();
    console.log('Resultados de búsqueda en asistencia:', attendanceSnap?.docs.map((doc) => doc.data()));

    if (attendanceSnap && !attendanceSnap.empty) {
      await this.showAlert('Asistencia Duplicada', 'Ya has registrado tu asistencia para esta asignatura hoy.');
    }else {
      const timestamp = firebase.firestore.Timestamp.fromDate(new Date());
      console.log('Registrando nueva asistencia...');
      await this.firestore
        .collection('users')
        .doc(userId)
        .collection('asistencia')
        .doc('asis')
        .collection('secciones')
        .doc(`${asignatura}_${seccion}`)
        .collection('registros')
        .add({
          asignatura,
          seccion,
          sala,
          fecha,
          timestamp,
        });
      console.log('Asistencia registrada con éxito.');
      await this.showAlert('Éxito', 'Asistencia registrada con éxito.');
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
    this.router.navigate(['/chat']);
    this.menuController.close();
  }

  openMenu() {
    this.menuController.open();
  }

  async getLocationAndWeather() {
    try {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          const locationResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
          );
          const locationData = await locationResponse.json();
          this.currentCity = locationData?.address?.city || 'Comuna desconocida';

          const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
          );
          const weatherData = await weatherResponse.json();

          this.currentTemperature = `${weatherData.current_weather.temperature}°C`;
          this.weatherDescription = this.getWeatherDescription(weatherData.current_weather.weathercode);
        },
        (error) => {
          console.error('Error al obtener la ubicación:', error);
        }
      );
    } catch (error) {
      console.error('Error al obtener el clima:', error);
    }
  }

  getWeatherDescription(code: number): string {
    switch (code) {
      case 0:
        return 'Clima claro';
      case 1:
        return 'Parcialmente nublado';
      case 2:
        return 'Nublado';
      case 3:
        return 'Lluvia ligera';
      case 4:
        return 'Lluvia moderada';
      case 5:
        return 'Lluvia fuerte';
      case 6:
        return 'Tormenta';
      case 7:
        return 'Nieve ligera';
      case 8:
        return 'Nieve moderada';
      case 9:
        return 'Nieve fuerte';
      default:
        return 'Clima desconocido';
    }
  }
}