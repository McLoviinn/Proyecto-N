import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  email: string = '';
  password: string = '';
  loading: boolean = false;
  errorMessage: string = '';

  constructor(private afAuth: AngularFireAuth, private navCtrl: NavController) {}

  async onLogin() {
    this.loading = true;
    this.errorMessage = '';

    try {
      await this.afAuth.signInWithEmailAndPassword(this.email, this.password);
      this.navCtrl.navigateRoot('/home'); // Navegar a la página de inicio tras login exitoso
    } catch (error) {
      this.errorMessage = 'Error al iniciar sesión. Verifica tus credenciales.';
    } finally {
      this.loading = false;
    }
  }
}
