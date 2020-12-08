import { Component, ViewEncapsulation } from '@angular/core';
import { SocketService } from './socket-service/socket-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  title = 'Cards Vs People';
  private gameStage = 0;
  constructor(private socketService: SocketService){}

  ngOnInit() {
    this.socketService.getSocket().on(('startGame'), () => {
      this.gameStage = 1;
    });
  }

  public isLobbyStage(): boolean {
    return this.gameStage == 0;
  }

  public isGameStage(): boolean {
    return this.gameStage == 1;
  }
}