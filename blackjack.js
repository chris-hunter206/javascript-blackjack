/* @author Christopher Hunter */
/* CSD122 Final project Spring 2022 */

/*
   This program will simulate a basic game of blackjack. implementation details:

   - One player will play against the dealer
   - The game will use a single deck of cards. When the cards are mostly used
     up, the discarded cards will be re-used, and the deck re-shuffled.
   - Player starts with 500 chips.
   - Bets need to be multiples of 10 (otherwise blackjack payouts may turn
     into fractions, which doesn't make sense for chips)
   - Player can double down their bet, if their initial card total is 9, 10, or 11.
     If they choose to double down, they will only recieve one more card
   - If the dealer has an ace or ten-card showing, they will check their face
     down card to see if they have blackjack. If they do, it will be revealed
     immediately, and players who don't also have blackjack will lose their
     bet
   - Some traditional blackjack features, like splitting pairs or insurance have
     not been implemented, as they require greatly increasing complexity.
 */

const readline = require("readline-sync");

// used to describe individual cards
class Card {
    constructor(face, suit, value) {
        this.face = face;       // Q, K, A, J or card number
        this.suit = suit;       // spades, hearts, clubs, or diamonds
        this.value = value;     // numeric value of this card for scoring
        this.shown = true;      // whether the card is face up or not
    }

    // toggle 'shown' field to false
    hideCard() {
        this.shown = false;
    }

    // toggle 'shown' field to true
    showCard() {
        this.shown = true;
    }

    // returns a string representation of the card
    toString() {
        let result = '[' + this.face + this.suit + '] ';
        if (this.shown === false) result = '[***] ';
        return result;
    }
}

// create deck of card objects. we will use a single deck of cards here
class Deck {
    constructor() {
        this.cards = [ // array of all cards in the deck
            new Card(" A", "♠", 11),
            new Card(" K", "♠", 10),
            new Card(" Q", "♠", 10),
            new Card(" J", "♠", 10),
            new Card("10", "♠", 10),
            new Card(" 9", "♠",  9),
            new Card(" 8", "♠",  8),
            new Card(" 7", "♠",  7),
            new Card(" 6", "♠",  6),
            new Card(" 5", "♠",  5),
            new Card(" 4", "♠",  4),
            new Card(" 3", "♠",  3),
            new Card(" 2", "♠",  2),
            new Card(" A", "♡", 11),
            new Card(" K", "♡", 10),
            new Card(" Q", "♡", 10),
            new Card(" J", "♡", 10),
            new Card("10", "♡", 10),
            new Card(" 9", "♡",  9),
            new Card(" 8", "♡",  8),
            new Card(" 7", "♡",  7),
            new Card(" 6", "♡",  6),
            new Card(" 5", "♡",  5),
            new Card(" 4", "♡",  4),
            new Card(" 3", "♡",  3),
            new Card(" 2", "♡",  2),
            new Card(" A", "♣", 11),
            new Card(" K", "♣", 10),
            new Card(" Q", "♣", 10),
            new Card(" J", "♣", 10),
            new Card("10", "♣", 10),
            new Card(" 9", "♣",  9),
            new Card(" 8", "♣",  8),
            new Card(" 7", "♣",  7),
            new Card(" 6", "♣",  6),
            new Card(" 5", "♣",  5),
            new Card(" 4", "♣",  4),
            new Card(" 3", "♣",  3),
            new Card(" 2", "♣",  2),
            new Card(" A", "♢", 11),
            new Card(" K", "♢", 10),
            new Card(" Q", "♢", 10),
            new Card(" J", "♢", 10),
            new Card("10", "♢", 10),
            new Card(" 9", "♢",  9),
            new Card(" 8", "♢",  8),
            new Card(" 7", "♢",  7),
            new Card(" 6", "♢",  6),
            new Card(" 5", "♢",  5),
            new Card(" 4", "♢",  4),
            new Card(" 3", "♢",  3),
            new Card(" 2", "♢",  2),
        ];
    }

    // this method shuffles the deck. Acts on the array of cards in-place
    shuffle() {
        const indexUsed = [];
        const initLength = this.cards.length;
        let randIndex = 0;
        let newCards = new Array(initLength);
        let i = 0;
        while (i < initLength) {
            randIndex = Math.floor(initLength * Math.random());
            if (!indexUsed.includes(randIndex)) {
                newCards[randIndex] = this.cards[i];
                indexUsed.push(randIndex);
                i++;
            }
        }
        this.cards = newCards;
    }

    // remove one card from the deck and return that object
    getCard() {
        return this.cards.pop();
    }
}

// This describes a collection of cards. Objects are created with a player
// name, and then cards are added individually later on.
class Hand {
    constructor(name, bet, deck) {
        this.name = name;
        this.bet = bet;         // amount of bet this hand
        this.deck = deck;       // reference to the deck object used
        this.stands = false;    // whether the player "stands" or not
        this.status = '';       // string to append to card output
        this.cards = [];        // array of cards the player has been dealt
    }

    // add a new card to the player's hand
    addCard(card) {
        card = this.deck.getCard();
        this.cards.push(card);
    }

    // add up the total of all the current cards, and return that value
    getTotal() {
        // total the cards
        let total = 0;
        for (const card of this.cards) {
            // don't count face down cards
            if (card.shown === true)
                total += card.value;
        }

        // handle aces counting as either 1 or 11. (If a player is dealt an
        // ace and other cards totalling 10 points, we will assume the player
        // will take the blackjack instead of counting the ace as 1).
        // this needs to happen after the total has been counted.
        for (const card of this.cards) {
            if (card.value === 11 && total > 21) {
                card.value = 1;
                total -= 10;
            }
        }

        // set special statuses automatically when total is counted
        if (total === 21) {
            if (this.cards.length === 2)
                // 21 on the first two cards
                this.status = "BLACKJACK!";
            else
                // must stand at 21
                this.status = "STAND";
        }
        if (total > 21)
            this.status = "BUSTED";
        return total;
    }

    // set the status display string
    setStatus(status) {
        this.status = status;
    }

    // return a formatted string representation of the hand
    displayCards() {
        let cardstr = "";
        for (const card of this.cards) {
            cardstr += card.toString();
        }
        return [this.getTotal().toString().padStart(2,' '), cardstr, this.status].join(' ');
    }

    toString() {
        return this.displayCards();
    }
}

// get some input from the user. parameter is the question to be prompted
function getInput(query) {
    let input = readline.question(query);
    return input;
}

// log winner message to the console
function whoWon(str, bet) {
    playerChips += Number(bet);
    console.log(`\n  ${str}${bet}, chips: ${playerChips})\n\n`);
}

// show all the cards on the table for the current round of play
function showCards(str, cardHands) {
    console.log(`\n---${str.padEnd(15, '-')}--------------------------`);
    for (let hand of cardHands) {
        console.log(`${hand.name}: ${hand.displayCards()}`);
    }
}

/* GAMEPLAY CODE */

// create and shuffle cards
let deck = new Deck();
deck.shuffle();

// place bets
let playerChips = 500;
let playerBet = 1;
while (playerBet % 10 !== 0) {
    playerBet = getInput("Welcome to Blackjack! How much would you like to bet? (increments of 10) ");
}
let lastBet = playerBet; // store this in case the bet changes during the hand

// main event loop loop
let playAgain = true;
while (playAgain) {

    // make sure we have enough cards to keep playing
    if (deck.cards.length < 15) {
        deck = new Deck();
        deck.shuffle();
        console.log('--------------------------------------------');
        console.log('The deck was reshuffled');
    }

    // Deal cards
    let playerHand = new Hand("Player", playerBet, deck);
    let dealerHand = new Hand("Dealer", playerBet, deck);
    let allHands = [dealerHand, playerHand];

    // two cards to each player, alternating
    playerHand.addCard();
    dealerHand.addCard();
    playerHand.addCard();
    dealerHand.addCard();

    // check the dealer's first two cards, to see if they make a natural blackjack
    // (either a ten value or an ace is showing, and the hidden card totals 21)
    if (dealerHand.getTotal() === 21) {
        // if dealer has a natural blackjack, other players must stand
        playerHand.stands = true;
    } else {
        // dealers 2nd card is face down, if it does not make a natuarl blackjack
        dealerHand.cards[1].hideCard();
        showCards('YOUR TURN', allHands);

        // check for double down, and set vars if player chooses yes
        playerDoubleDown = false;
        if (playerHand.getTotal() >= 9 && playerHand.getTotal() <=11) {
            let choice = 'a';
            while (choice !== 'y' && choice !== 'n') {
                choice = getInput("Would you like to double down your bet? (y/n) ").toLowerCase();
            }
            if (choice === 'y') {
                playerDoubleDown = true;
                playerBet *= 2;
            }
        }
    }

    // player plays
    while (playerHand.getTotal() <= 21 && playerHand.stands === false) {
        if (playerDoubleDown && playerHand.cards.length < 3) {
            // player must take one card and then stand on a double down bet
            playerHand.addCard();
            playerHand.stands = true;
            playerHand.setStatus("STAND");
            showCards("YOU STAND (DD)", allHands);
        } else {
            if (playerHand.getTotal() === 21) {
                // must stand at 21
                playerHand.stands = true;
                if (playerHand.cards.length !== 2) {
                    // 21 but not a natural blackjack
                    playerHand.setStatus("STAND");
                }
            } else {
                let next = getInput(`(H)it or (S)tand `).toLowerCase();
                if (next === 's') {
                    playerHand.stands = true;
                    playerHand.setStatus("STAND");
                }
                if (next === 'h') {
                    playerHand.addCard();
                    showCards('YOUR TURN', allHands);
                }
            }
        }
    }

    // dealer plays
    dealerHand.cards[1].showCard(); // reveal the hidden card
    if (playerHand.status === "BLACKJACK!") {
        // dealer skips play if player has blackjack
        showCards('DEALER STANDS', allHands);
    } else {
        // dealer takes action
        while (dealerHand.getTotal() <= 21 && dealerHand.stands === false) {
            if (dealerHand.getTotal() < 17) {
                // dealer must hit at 16 or less
                dealerHand.addCard();
                showCards('DEALER HITS', allHands);
            } else {
                // dealer must stand at 17-21
                dealerHand.setStatus("STAND");
                dealerHand.stands = true;
                showCards('DEALER STANDS', allHands);
            }
        }
    }

    // show result of hand
    const playerFinal = playerHand.getTotal();
    const dealerFinal = dealerHand.getTotal();

    if (playerHand.status === "BLACKJACK!" && dealerHand.getTotal() !== 21) {
        // player gets paid 1.5 x bet for natural blackjack
        whoWon("You won 1.5x your bet! (+", playerBet * 1.5);
    } else if (playerFinal > 21) {
        // player busted
        whoWon("You Busted. (", (-1 * playerBet));
    } else if (dealerFinal > 21) {
        // dealer busted
        whoWon("The Dealer Busted! (+", playerBet);
    } else {
        // nobody busted, count highest hand
        if (playerFinal > dealerFinal) {
            whoWon("You won! (+", playerBet);
        } else if (playerFinal < dealerFinal) {
            whoWon("The Dealer Won. (", (-1 * playerBet));
        } else {
            // the score must be a tie
            console.log(`\n  Tied with dealer. You keep your bet. (chips: ${playerChips})\n\n`);
        }
    }

    // end main loop. ask for new bet or exit game. hitting 'enter' re-uses the
    // last bet amount
    let askAgain = true;
    while (askAgain) {
        let newPlayerBet = getInput(`Enter your next bet in increments of 10: (quit:0, enter: ${lastBet}) `);
        if (newPlayerBet === "0") {
            // exit the game
            playAgain = false;
            askAgain = false;
        }
        if (newPlayerBet !== "" && newPlayerBet % 10 === 0) {
            // set a new bet
            playerBet = newPlayerBet;
            askAgain = false;
        }
        if (newPlayerBet === "") {
            // keep the same bet
            askAgain = false
            playerBet = lastBet;
        }
    }
}