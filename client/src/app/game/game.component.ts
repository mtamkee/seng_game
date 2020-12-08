import { Component } from '@angular/core';
import { SocketService } from '../socket-service/socket-service';
import { Card } from './card';
import { ReplaySubject, BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { startWith } from 'rxjs/operators'
import { map } from "rxjs/operators";
import { Globals } from "../globals";
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

@Component({
  selector: 'game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.less']
})
export class GameComponent {
  private hand: BehaviorSubject<Card[]> = new BehaviorSubject<Card[]>([]);
  private numSpaces: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  private isMyTurn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private currentBlackCard: ReplaySubject<Card> = new ReplaySubject<Card>(1);
  private currentBlackCardText: Observable<string> = this.currentBlackCard.pipe(map((card: Card) => {
    return card.text.replace(/_/g,"___");
  }));
  private whiteCardSubmissions: BehaviorSubject<Card[][]> = new BehaviorSubject<Card[][]>([]);
  private selectedCards: BehaviorSubject<Card[]> = new BehaviorSubject<Card[]>([]);
  private thisTurnSubmitted: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private winnerName: BehaviorSubject<string> = new BehaviorSubject<string>("");

  // 0: Submitting cards
  // 1: Picking from submissions
  // 2: Viewing winning submission
  private currentStage: number = 0;

  private guidanceText: Observable<string> = this.isMyTurn.pipe(map((isMyTurn: boolean) => {
    return isMyTurn ? "Wait for submissions!" : "Drag a card here!";
  }));

  private canSelectMoreCards: Observable<boolean> = 
    combineLatest(this.isMyTurn, this.numSpaces, this.selectedCards, this.thisTurnSubmitted)
    .pipe(map(([isMyTurn, numSpaces, selectedCards, thisTurnSubmitted]) => {
      return !thisTurnSubmitted && !isMyTurn && selectedCards.length < numSpaces;
    })).pipe(startWith(false));

  private selectionBoxLength: Observable<string> = this.numSpaces.pipe(map((numSpaces) => {
    switch (numSpaces) {
      case 1:
        return "one";
      case 2:
        return "two";
      case 3:
        return "three";
      // Probably won't get here
      case 4:
        return "four";
      case 5:
        return "five";
    }
  }));

  constructor(private socketService: SocketService,
              private globals: Globals){}

  ngOnInit() {
    this.socketService.getSocket().on('setHand', (data) => {
      if (data.status == 'success') {
        this.hand.next(data.msg.map((cardJSON, index) => {
          return new Card(cardJSON, index);
        }));
      }
    });

    this.socketService.getSocket().on('setBlackCard', (data) => {
      if (data.status == 'success') {
        this.currentBlackCard.next(new Card(data.msg.card));
        this.numSpaces.next(data.msg.card.pick);
        // When we receive a black card, a new turn has been started, so remove previous submissions
        // TODO: Clean up new turn emissions
        this.whiteCardSubmissions.next([]);
        this.winnerName.next("");
        this.thisTurnSubmitted.next(false);
        this.currentStage = 0;
      }
    });

    this.socketService.getSocket().on('sendWhiteCardSelections', (data) => {
      if (data.status == 'success') {
        this.whiteCardSubmissions.next(data.msg.map((cardsByPlayer) => {
          return cardsByPlayer.cards.map((cardJSON) => {
            return new Card(cardJSON);
          });
        }));
        this.currentStage = 1;
      }
    });

    this.socketService.getSocket().on('setIsMyTurn', (data) => {
      if (data.status == 'success') {
        this.isMyTurn.next(data.msg);
      }
    });

    this.socketService.getSocket().on('displayWinner', (data) => {
      if (data.status == 'success') {
        this.winnerName.next(data.msg[0])
        this.whiteCardSubmissions.next([this.whiteCardSubmissions.value[data.msg[1]]]);
      }
    });
  }

  public getHand(): Observable<Card[]> {
    return this.hand;
  }

  public getCurrentBlackCardText(): Observable<string> {
    return this.currentBlackCardText;
  }

  public sendSelectedWhiteCard(): void {
    let selectedIndexes: number[] = this.selectedCards.value.map((card: Card) => {
      return card.index;
    });
    this.socketService.getSocket().emit('sendWhiteCard', selectedIndexes, this.globals.playerId, this.globals.roomName, (response) => {
      if (response.status == 'success') {
        this.thisTurnSubmitted.next(true);
        this.selectedCards.next([])
      }
    });
  }

  public isMyTurnObservable(): Observable<boolean> {
    return this.isMyTurn;
  }

  public getSelectedCards(): Observable<Card[]> {
    return this.selectedCards;
  }

  public getWhiteCardSubmissions(): Observable<Card[][]> {
    return this.whiteCardSubmissions;
  }

  public getCanSelectMoreCards(): Observable<boolean> {
    return this.canSelectMoreCards;
  }

  public selectSubmission(index: number): void {
    this.socketService.getSocket().emit('selectWinner', index, this.globals.playerId, this.globals.roomName);
  }

  public drop(event: CdkDragDrop<Card[]>): void {
    if (event.previousContainer === event.container) {
      // Big hax to only allow self moving within selection container
      if (event.previousContainer.element.nativeElement.id === "selections") {
        // Previous selected cards
        let newSelections = this.selectedCards.value;

        // Remove element from old position
        let removed = newSelections.splice(event.previousIndex, 1)[0];

        // Put it in new position
        newSelections.splice(event.currentIndex, 0, removed);

        // Emit the new sets
        this.selectedCards.next(newSelections);
      } else {
        // Previous hand
        let newHand = this.hand.value;

        // Remove element from old position
        let removed = newHand.splice(event.previousIndex, 1)[0];

        // Put it in new position
        newHand.splice(event.currentIndex, 0, removed);

        // Emit the new sets
        this.hand.next(newHand);
      }
    } else {
      // If going from selections to hand
      if (event.previousContainer.element.nativeElement.id === "selections") {
        // Previous selected cards
        let newSelections = this.selectedCards.value;

        // Remove element from old position
        let removed = newSelections.splice(event.previousIndex, 1)[0]

        // Previous hand
        let newHand = this.hand.value;

        // Add card to hand
        newHand.splice(event.currentIndex, 0, removed);

        // Emit the new sets
        this.selectedCards.next(newSelections);
        this.hand.next(newHand);
      } else {
        // Going from hand to selections

        // Previous hand
        let newHand = this.hand.value;

        // Remove element from old position
        let removed = newHand.splice(event.previousIndex, 1)[0]

        // Previous selected cards
        let newSelections = this.selectedCards.value;

        // Add card to selected cards
        newSelections.splice(event.currentIndex, 0, removed);

        // Emit the new sets
        this.selectedCards.next(newSelections);
        this.hand.next(newHand);
      }
    }
  }

  public getThisTurnSubmitted(): Observable<boolean> {
    return this.thisTurnSubmitted;
  }

  public getSelectionBoxLength(): Observable<string> {
    return this.selectionBoxLength;
  }

  public isStageNumber(stage: number): boolean {
    return stage === this.currentStage;
  }

  public getGuidanceText(): Observable<string> {
    return this.guidanceText;
  }

  public getWinnerName(): Observable<string> {
    return this.winnerName;
  }
}