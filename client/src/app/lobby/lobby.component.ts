import { Component, OnInit } from '@angular/core';
import { SocketService } from '../socket-service/socket-service';
import { Globals } from '../globals';
import { Subject, Observable, BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.less']
})
export class LobbyComponent implements OnInit {
  private roomNameInput: string;
  private nameInput: string;
  private roomCreator: boolean;
  private playerNames: Subject<string> = new Subject<string>();
  private nameFieldIsEmpty: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  private invalidName: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private invalidRoomName: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(private socketService: SocketService,
              private globals: Globals) {}

  ngOnInit() {
    this.roomCreator = false;
    this.socketService.getSocket().on('updatePlayerNames', (names) => {
      this.playerNames.next(names);
    });
  }

  public createRoom(): void {
    if (this.nameFieldIsEmpty.value == true) {
      return;
    }

    this.globals.playerName = this.nameInput;

    this.socketService.getSocket().emit('createRoom', this.globals.playerName, (response) => {
      if (response.status == "success") {
        this.globals.playerId = response.msg.playerId;
        this.globals.roomName = response.msg.roomName;
        this.roomCreator = true;
      } else {
        this.invalidName.next(true);
      }
    });
  }

  public joinRoom(): boolean {
    if (this.nameFieldIsEmpty.value == true) {
      return;
    }

    this.globals.playerName = this.nameInput;

    this.socketService.getSocket().emit('joinRoom', this.globals.playerName, this.roomNameInput, (response) => {
      if (response.status == "success") {
        this.globals.playerId = response.msg.playerId;
        this.globals.roomName = response.msg.roomName;
      } else {
        if (response.msg == "invalid_name") {
          this.invalidName.next(true);
        } else if (response.msg == "wrong_room") {
          this.invalidRoomName.next(true);

          // If we're here, that means the name is okay
          this.invalidRoomName.next(false);
        }
      }
    });
    // Stop page reload on pressing Enter for form
    return false;
  }

 public isInRoom(): boolean {
   return this.globals.roomName != undefined && this.globals.roomName.length > 0;
 }

 public createdRoom(): boolean {
   return this.roomCreator;
 }

 public startGame(): void {
   this.socketService.getSocket().emit('startGame', this.globals.playerId, this.globals.roomName);
 }

 public getRoomName(): string {
   return this.globals.roomName;
 }

 public getPlayerNames(): Observable<string> {
   return this.playerNames;
 }

 public updateNameFieldIsEmpty(): void {
   this.nameFieldIsEmpty.next(this.nameInput.length == 0);
 }

 public getNameFieldIsEmpty(): Observable<boolean> {
   return this.nameFieldIsEmpty;
 }

 public getInvalidName(): Observable<boolean> {
   return this.invalidName;
 }

 public getInvalidRoomName(): Observable<boolean> {
   return this.invalidRoomName;
 }

 public getMyName(): string {
   return this.globals.playerName;
 }
}