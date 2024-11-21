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
  showPassword: boolean = false; // Aquí se define la propiedad 'showPassword'

  constructor(private afAuth: AngularFireAuth, private navCtrl: NavController) {}

  async onLogin() {
    this.loading = true;
    this.errorMessage = '';

    try {
      await this.afAuth.signInWithEmailAndPassword(this.email, this.password);
      this.navCtrl.navigateRoot('/home'); // Redirige al home si el login es exitoso
    } catch (error) {
      this.errorMessage = 'Correo o contraseña incorrectos.';
    } finally {
      this.loading = false;
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword; // Esta función alterna la visibilidad de la contraseña
  }
}
