import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-recuperar-contrasena',
  templateUrl: './recuperar-contrasena.page.html',
  styleUrls: ['./recuperar-contrasena.page.scss'],
})
export class RecuperarContrasenaPage {
  email: string = '';

  constructor(
    private afAuth: AngularFireAuth,
    private router: Router,
    private toastController: ToastController
  ) {}

  async recuperarContrasena() {
    try {
      await this.afAuth.sendPasswordResetEmail(this.email);
      this.mostrarToast('Se ha enviado un enlace para restablecer tu contraseña.');
      this.router.navigate(['/login']);
    } catch (error) {
      this.mostrarToast('Error al enviar el enlace de recuperación. Intenta nuevamente.');
    }
  }

  async mostrarToast(mensaje: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      position: 'top',
    });
    toast.present();
  }
}
