
"use strict";

// Make Module a namespace 
var Deck = (function () {
    
    var communityCards = [];
    const _blankCard = "blank1.png";

    /// cardSuit, cardNo, cardIdent
    var cards = [new card("H", 1, "2"), new card("H", 2, "3"), new card("H", 3, "4"),
        new card("H", 4, "5"), new card("H", 5, "6"), new card("H", 6, "7"),
        new card("H", 7, "8"), new card("H", 8, "9"), new card("H", 9, "10"),
        new card("H", 10, "J"), new card("H", 11, "Q"), new card("H", 12, "K"),
        new card("H", 13, "A"), new card("D", 1, "2"), new card("D", 2, "3"),
        new card("D", 3, "4"), new card("D", 4, "5"), new card("D", 5, "6"),
        new card("D", 6, "7"), new card("D", 7, "8"), new card("D", 8, "9"),
        new card("D", 9, "10"), new card("D", 10, "J"), new card("D", 11, "Q"),
        new card("D", 12, "K"),
        new card("D", 13, "A"), new card("C", 1, "2"), new card("C", 2, "3"),
        new card("C", 3, "4"), new card("C", 4, "5"), new card("C", 5, "6"),
        new card("C", 6, "7"), new card("C", 7, "8"), new card("C", 8, "9"),
        new card("C", 9, "10"), new card("C", 10, "J"), new card("C", 11, "Q"),
        new card("C", 12, "K"), new card("C", 13, "A"), new card("S", 1, "2"),
        new card("S", 2, "3"), new card("S", 3, "4"), new card("S", 4, "5"),
        new card("S", 5, "6"), new card("S", 6, "7"), new card("S", 7, "8"),
        new card("S", 8, "9"), new card("S", 9, "10"), new card("S", 10, "J"),
        new card("S", 11, "Q"), new card("S", 12, "K"), new card("S", 13, "A")];

    function card(cardSuit, cardNo, cardIdent) {
        this.cardSuit = cardSuit;
        this.cardNo = cardNo;
        this.cardIdent = cardIdent;
        this.getCardDisplayImage = function (getFaceCard) {
            if (getFaceCard) { // Show card 
                return this.cardIdent + this.cardSuit + ".png";
            } else { // Get blank
                return _blankCard;
            }
        }
    };

    var shuffleDeck = function () {

        var i = cards.length - 1;

        var randomCardNo = 0;
        var deckToShuffle = cards.slice(0);
        var shuffledDeck = [];
        var counter = i+ 1;

        for (i; i >= 0; i--) {
            randomCardNo =  Math.floor((Math.random() * counter) + 0);
            shuffledDeck.push(deckToShuffle[randomCardNo]);
            deckToShuffle.splice(randomCardNo, 1);
            counter -= 1;
        }

        return shuffledDeck;
    };
    
    var getCards = function () {
        return cards;
    };

    return {
        getCards: getCards,
        shuffleDeck: shuffleDeck
    };

})();














