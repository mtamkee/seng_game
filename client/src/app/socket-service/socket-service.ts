import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket:SocketIOClient.Socket;
  constructor() {
    // TODO: Fix this
      this.socket = io.connect(window.location.host == "localhost:4200" ? "localhost:9001" : window.location.host);
      //this.socket = io.connect("192.168.1.109:9001");
  }
  public getSocket():SocketIOClient.Socket {
    return this.socket;
  }
}
