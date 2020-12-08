export class Card {

  // Card text
  public text: string;

  // The card's initial position in the player's hand
  public index: number;
  constructor(data: any, index: number = -1) {
    this.text = data.text;
    this.index = index;
  }
}