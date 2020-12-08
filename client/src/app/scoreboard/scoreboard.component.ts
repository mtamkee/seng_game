import { Component } from '@angular/core';
import { ReplaySubject, BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { SocketService } from '../socket-service/socket-service'; 

@Component({
  selector: 'scoreboard',
  templateUrl: './scoreboard.component.html',
  styleUrls: ['./scoreboard.component.less']
})

export class ScoreBoardComponent {
  private scores: BehaviorSubject<[string, number][]> = new BehaviorSubject<[string, number][]>([]);

  constructor(private socketService: SocketService) {
    this.socketService.getSocket().on('setScores', (data) => {
      if (data.status == 'success') {
        this.scores.next(data.msg);
      }
    });
  }

  public getScores(): Observable<(string | number)[][]> {
    return this.scores;
  }
}
