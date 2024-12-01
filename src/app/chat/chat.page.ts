import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
})
export class ChatPage implements OnInit {
  messages: any[] = []; // Lista de mensajes del chat
  newMessage: string = ''; // Mensaje nuevo a enviar
  groupId: string = 'groupId'; // ID del grupo de chat (cambia según el grupo)
  currentUserId: string = ''; // ID del usuario actual

  constructor(
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth
  ) {}

  ngOnInit() {
    this.afAuth.currentUser.then((user) => {
      if (user) {
        this.currentUserId = user.uid; // Guarda el ID del usuario actual
      }
    });

    // Cargar mensajes en tiempo real
    this.firestore
      .collection(`chats/${this.groupId}/messages`, (ref) =>
        ref.orderBy('timestamp')
      )
      .valueChanges()
      .subscribe((data) => {
        this.messages = data; // Asignar los mensajes a la lista
      });
  }

  async sendMessage() {
    const user = await this.afAuth.currentUser; // Obtener usuario autenticado
    if (user && this.newMessage.trim()) {
      await this.firestore.collection(`chats/${this.groupId}/messages`).add({
        senderId: user.uid,
        senderName: user.displayName || 'Anónimo',
        messageText: this.newMessage,
        timestamp: Date.now(),
      });
      this.newMessage = ''; // Limpiar el campo de entrada
    }
  }
}
