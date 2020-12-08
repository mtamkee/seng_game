import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { SocketService } from './socket-service/socket-service';
import { AppComponent } from './app.component';
import { LobbyComponent } from './lobby/lobby.component';
import { FormsModule } from '@angular/forms';
import { GameComponent } from './game/game.component';
import { Globals } from './globals';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScoreBoardComponent } from './scoreboard/scoreboard.component';

@NgModule({
  declarations: [
    AppComponent,
    LobbyComponent,
    GameComponent,
    ScoreBoardComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    DragDropModule
  ],
  providers: [SocketService, Globals],
  bootstrap: [AppComponent]
})
export class AppModule {}
