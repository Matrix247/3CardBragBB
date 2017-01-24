"use strict";

// Make Module a namespace 
var ThreeCardBragBB = (function () {

    var _currentPlayer = 0;
    var _communityCards = [];
    var _dealerPos = 0;
    var _playerKnocked = false;
    var _players = [];
    var _playerCount = 0;
    var _deck = [];

    function init(deck) {
        _deck = deck;
    }

    function newGame() {

        /// isDealer, holeCards[], lifes, cardPlaceHolder, isHuman, hasKnocked
        _players = [new player(true, [], 3, "#player1Cards", "#player1Display", "#player1", false, false, "Player 1"),
                    new player(false, [], 3, "#player2Cards", "#player2Display", "#player2", false, false, "Player 2"),
                    new player(false, [], 3, "#player3Cards", "#player3Display", "#player3", false, false, "Player 3"),
                    new player(false, [], 3, "#player4Cards", "#player4Display", "#player4", true, false, "Human player")];

        _playerCount = _players.length;

        startTurn();
    }

    /// Determine what hands are availalbe for all players
    function determinePlayerAction()
    {
        var x = 0;
        var results = [];

        // First check the community cards to see if there are any made hands
        results.push(runHandMatrix(_communityCards[0], _communityCards[1],
               _communityCards[2], 4, 4));

        // Loop through community cards to see if any hands are possible
        for (x; x <= _communityCards.length - 1; x++) {
            results.push(runHandMatrix(_communityCards[x], _players[_currentPlayer].holeCards[1],
                _players[_currentPlayer].holeCards[2],0,x));

            results.push(runHandMatrix(_players[_currentPlayer].holeCards[0], _communityCards[x],
                _players[_currentPlayer].holeCards[2],1,x))

            results.push(runHandMatrix(_players[_currentPlayer].holeCards[0], _players[_currentPlayer].holeCards[1],
                _communityCards[x],2,x));
        }

        // Sort by hand strength
        results.sort(firstBy(function (a, b) {
            return b.strength - a.strength}).thenBy(function (a,b) { return b.highCard - a.highCard } ));

        // Community cards represent the best hand so chancge all three cards
        if (results[0].holeCardToChange === 4) {

            swapAllCards();
          
        } 
        else { // Just change one card

            // Make the swap based on the best hand available and decide whether to knock or not
            var holeCardToChange = _players[_currentPlayer].holeCards[results[0].holeCardToChange];
            var commCardToChange = _communityCards[results[0].communityCardToChange];

            // Swap the cards over
            _players[_currentPlayer].holeCards[results[0].holeCardToChange] = commCardToChange;
            _communityCards[results[0].communityCardToChange] = holeCardToChange;
        }

        // If hand is better than a 10 high flush then knock
        var minHandStrength = 0;
        var minHighCard = 0;

        switch(_playerCount){
            case 2:
                // Pair of 77s or better
                minHandStrength = 8;
                break;
            case 3:
                // Pair of AAs or better
                minHandStrength = 14;
                break;
            case 4:
                // Flsuh, 8 high or better
                minHandStrength = 15;
                minHighCard = 9;
                break;
        }

        if (results[0].strength >= minHandStrength) {

            if (results[0].highCard >= minHighCard && !_playerKnocked) {
                _players[_currentPlayer].hasKnocked = true;
                _playerKnocked = true;
            } 
        }

        // Set the players selected hand
        _players[_currentPlayer].selectedHand = results[0];

        setTimeout(function () {

            if(_players[_currentPlayer].hasKnocked === true) {
                $(_players[_currentPlayer].display).append("<br/><span class='knocked'>KNOCKED</span>");
            }
            
            swapCardMoveNextPlayer();
            
        }, 4000);

    }

    function swapAllPlayerCards() {

        if (_players[_currentPlayer].isHuman) {

            swapAllCards();

            var madeHand = runHandMatrix(_players[_currentPlayer].holeCards[0], _players[_currentPlayer].holeCards[1],
                            _players[_currentPlayer].holeCards[2], 4, 4);

            if ($("#playerHasKnocked").is(':checked') && !_playerKnocked) {
                _players[_currentPlayer].hasKnocked = true;
                $(_players[_currentPlayer].display).append("<br/><span class='knocked'>KNOCKED</span>");
                _playerKnocked = true;
            }

            _players[_currentPlayer].selectedHand = madeHand;

            swapCardMoveNextPlayer();
        }
    }

    function swapAllCards() {

        var holeCards = _players[_currentPlayer].holeCards.slice();

        _players[_currentPlayer].holeCards[0] = _communityCards[0];
        _players[_currentPlayer].holeCards[1] = _communityCards[1];
        _players[_currentPlayer].holeCards[2] = _communityCards[2];

        _communityCards[0] = holeCards[0];
        _communityCards[1] = holeCards[1];
        _communityCards[2] = holeCards[2];
    }

    function swapCardMoveNextPlayer() {

        $(_players[_currentPlayer].cardPlaceHolder).html("");
        $("#communityCards").html("");

        for (var r = 0; r <= 2; r++) {

            $("#communityCards").append("<img draggable='true' id=\"" + r + "\" ondragstart='ThreeCardBragBB.drag(event)' style='padding:3px;' height='120' width='75'" +
            "src=\"/resources/images/cards/" + _communityCards[r].getCardDisplayImage(true) + "\" />");

            $(_players[_currentPlayer].cardPlaceHolder).append("<img style='padding:3px;' height='120' width='75'" +
            "id=\"" + r + "\" src=\"/resources/images/cards/" + _players[_currentPlayer].holeCards[r].getCardDisplayImage(_players[_currentPlayer].isHuman) + "\" />");
        }

        // Remove current player highlight
        $(_players[_currentPlayer].outerDisplay).attr("class", "playerNotHighlighted");

        _currentPlayer++;

        if (_currentPlayer > (_playerCount - 1)) {
            _currentPlayer = 0;
        }

        _players[_currentPlayer].takeTurn();
    }

    function runHandMatrix(card1, card2, card3, holeCardNo, commCardNo)
    {     
        var cards = [card1, card2, card3];
      
        /// Calculate the high card for nay made hand
        var cardNumberArray = [card1.cardNo, card2.cardNo, card3.cardNo];
        cardNumberArray.sort(function (a, b) { return b - a; });
        var highCard = cardNumberArray[0];

        /// Calculate the low card
        cardNumberArray.sort(function (a, b) { return a - b; });
        var lowCard = cardNumberArray[0];

        /// Test for 3-of-a-kind (trips)
        if (checkForFlushOrTrips(card1.cardNo, card2.cardNo, card3.cardNo))
        {
            if (card1.cardNo === 2 && card2.cardNo === 2 && card3.cardNo === 2)
            { return new madeHand(21, cards, "3kind (333)", highCard, holeCardNo, commCardNo); }
            else
            { return new madeHand(20, cards, "3kind", highCard, holeCardNo, commCardNo); }
        }

        /// Test for a run
        if (checkForRun(card1.cardNo, card2.cardNo, card3.cardNo))
        {
            var hasA23Run = lowCard === 1 && highCard === 13 ? true : false;

            if (checkForFlushOrTrips(card1.cardSuit, card2.cardSuit, card3.cardSuit)) {

                if (hasA23Run) {
                    return new madeHand(19, cards, "StraightFlush (A23)", highCard, holeCardNo, commCardNo);
                }
                else {
                    return new madeHand(18, cards, "StraightFlush", highCard, holeCardNo, commCardNo);
                }
            }
            else {
                if (hasA23Run) {
                    return new madeHand(17, cards, "Run (A23)", highCard, holeCardNo, commCardNo);
                }
                else {
                    return new madeHand(16, cards, "Run", highCard, holeCardNo, commCardNo);
                }
            }
        }

        /// Test for possible flush
        if (checkForFlushOrTrips(card1.cardSuit, card2.cardSuit, card3.cardSuit))
        { return new madeHand(15, cards, "Flush", highCard, holeCardNo, commCardNo); }

        /// Test for a pair
        if (checkForPair(card1.cardNo, card2.cardNo, card3.cardNo))
        {
            var pairedCard = 0;

            // Find out which cards make the pair
            if (card1.cardNo === card2.cardNo) {
                pairedCard = card1.cardNo;
                highCard = card3.cardNo;
            } else if (card1.cardNo === card3.cardNo) {
                pairedCard = card1.cardNo;
                highCard = card2.cardNo;
            } else {
                pairedCard = card2.cardNo;
                highCard = card1.cardNo;
            }

            return new madeHand(pairedCard+1, cards, "Pair", highCard, holeCardNo, commCardNo);
        }

        return new madeHand(1, cards, "HighCard", highCard, holeCardNo, commCardNo);
    }

    /// Test for a pair
    function checkForPair(card1, card2, card3) {

        if (card1 === card2 || card1 === card3 ||
            card2 === card3) {
            return true;
        }

        return false;
    }
 
    /// Test for 3-of-a-kind (trips) and flush
    function checkForFlushOrTrips(card1, card2, card3) {

        if (card1 === card2 && card1 === card3 &&
            card2 === card3) {
           return true;
        }

        return false;
    }

    function checkForRun(num1, num2, num3) {

        var sortArr = [num1, num2, num3];

        sortArr.sort(function (a, b) {
            return a - b;
        })

        /// If the player holds an ace (card 13), then check for A23 run
        if (sortArr[2] === 13) {
            if (sortArr[0] === 1 && sortArr[1] === 2) {
                return true;
            }
        }

        if ((sortArr[0] + 1) === sortArr[1] && (sortArr[1] + 1) === sortArr[2]) {
            return true;
        }

        return false;
    }

    /// Deal cards to all players and then begin game by moving to 1st player for action
    var deal = function (deck) {

        // Determine what cards to select from deck based on amount of players, add one to account for community cards
        // E.g. each player gets 3 cards plus there are 3 community cards
        var noCardsToBeDealt = (_playerCount * 3) + 2;
        var totalPlayers = _playerCount;
        var cardsDealt = 0;
        var currentCard = 0;
        var i = 0;
        var spacer = 2000;

        for (i; i <= noCardsToBeDealt; i++) {

            (function loop(spacer1, i1) {

                setTimeout(function () {

                    if (_currentPlayer > (_playerCount - 1)) {
                        _currentPlayer = 0;
                    }

                    /// Always deal a community card after last player card has been dealt
                    if (cardsDealt === totalPlayers) {

                        _communityCards[currentCard] = deck[i1];

                        $("#communityCards").append("<img draggable='true' id=\"" + currentCard + "\" ondragstart='ThreeCardBragBB.drag(event)'" +
                            "style='padding:3px;' height='120' width='75' src=\"/resources/images/cards/" + deck[i1].getCardDisplayImage(true) + "\" />");

                        currentCard += 1;
                        cardsDealt = 0;
                    }
                    else {
      
                        _players[_currentPlayer].holeCards[currentCard] = deck[i1];

                        $(_players[_currentPlayer].cardPlaceHolder).append("<img style='padding:3px;' height='120' width='75'" +
                            "id=\"" + currentCard + "\" src=\"/resources/images/cards/" + deck[i1].getCardDisplayImage(_players[_currentPlayer].isHuman) + "\" />");

                        _currentPlayer += 1;
                        cardsDealt += 1;
                    }

                    /// Start the turn off, by allowing the 1st player to make their move
                    if (i1 === noCardsToBeDealt) {
                        $("#gameMessages").html("");
                        _players[_currentPlayer].takeTurn();
                    }

                }, spacer1)
                
            })(spacer,i);

            spacer += 250;
        }
    }

    var startTurn = function () {

        var i = 0;

        // Shuffle deck ready for turn
        var shuffledDeck = _deck.shuffleDeck();

        // Clear players and community cards
        for (i ; i <= _playerCount - 1; i++) {

            $(_players[i].cardPlaceHolder).html("");

            if (_players[i].isDealer) {
                $(_players[i].display).html(_players[i].name + " (DEALER)<br/>Lifes: " + _players[i].lifes);
            } else {
                $(_players[i].display).html(_players[i].name + "</br>Lifes: " + _players[i].lifes);
            }

            $(_players[i].outerDisplay).attr("class", "playerNotHighlighted");
            _players[i].hasKnocked = false;
        }

        $("#gameMessages").html("New game dealing cards.....");
        $("#communityCards").html("");
        $("#playerHasKnocked").attr('checked', false);

        // Determine current player to the right of dealer
        _currentPlayer = _dealerPos + 1;

        if (_currentPlayer > (_playerCount - 1)) {
            _currentPlayer = 0;
        }

        // Deal cards to players and set community cards
        deal(shuffledDeck)
    };

    function madeHand(strength, cards, handType, highCard, holeCardToChange, communityCardToChange) {

        this.strength = strength;
        this.cards = cards;
        this.handType = handType;
        this.highCard = highCard;
        this.holeCardToChange = holeCardToChange;
        this.communityCardToChange = communityCardToChange;
    }

    function player(isDealer, holeCards, lifes, cardPlaceHolder, display, outerDisplay, isHuman, hasKnocked, name, selectedHand) {

        this.isDealer = isDealer;
        this.holeCards = holeCards;
        this.lifes = lifes;
        this.cardPlaceHolder = cardPlaceHolder;
        this.display = display;
        this.outerDisplay = outerDisplay;
        this.isHuman = isHuman;
        this.hasKnocked = hasKnocked;
        this.name = name;
        this.selectedHand = selectedHand;
        this.takeTurn = function () {

            $(this.outerDisplay).attr("class", "playerHighlighted");

            /// Check to see if a player has knocked, if so end the round and see who loses
            /// check to see who has the weakest hand, and remove life
            if (this.hasKnocked) {

                var tempPlayerArray = _players.slice();
                var i = 0, z = 0;
                var humanPlayerAlive = true;

                _playerKnocked = false;

                // Remove dealer
                _players[_dealerPos].isDealer = false;

                // Flip all cards over
                for (i; i <= _playerCount - 1; i++) {

                    $(_players[i].cardPlaceHolder).html("");

                    for (z = 0; z <= 2; z++) {
                        $(_players[i].cardPlaceHolder).append("<img style='padding:3px;' height='120' width='75'" +
                            "id=\"" + z + "\" src=\"/resources/images/cards/" + _players[i].holeCards[z].getCardDisplayImage(true) + "\" />");
                    }
                }

                // See who has the worst hand and remove life
                // Sort by hand strength
                tempPlayerArray.sort(firstBy(function (a, b) {
                    return a.selectedHand.strength - b.selectedHand.strength
                }).thenBy(function (a, b) { return a.selectedHand.highCard - b.selectedHand.highCard }));

                var losingPlayer = [];

                // If last hand weaker than next best then that player loses life
                if (tempPlayerArray[0].selectedHand.strength < tempPlayerArray[1].selectedHand.strength) {

                    losingPlayer = $.grep(_players, function (e) { return e.name === tempPlayerArray[0].name; });
                    losingPlayer[0].lifes -= 1;
                    $("#gameMessages").html(tempPlayerArray[0].name + " losses!!");

                } else if (tempPlayerArray[0].selectedHand.highCard < tempPlayerArray[1].selectedHand.highCard) {
                    // Two players have the same hand, so check kicker
                    losingPlayer = $.grep(_players, function (e) { return e.name === tempPlayerArray[0].name; });
                    losingPlayer[0].lifes -= 1;
                    $("#gameMessages").html(tempPlayerArray[0].name + " losses!!");
                }
                else {
                    // Round is a tie, no player loses a life
                    $("#gameMessages").html("Round is a draw");
                };

                // A Player is dead
                if (losingPlayer.length > 0 && losingPlayer[0].lifes <= 0) {

                    var deadPlayerIndex = _players.indexOf(tempPlayerArray[0]);
                    $(_players[deadPlayerIndex].cardPlaceHolder).html("");
                    $(_players[deadPlayerIndex].outerDisplay).attr("class", "playerDead");
                    $(_players[deadPlayerIndex].display).html("");

                    _players.splice(deadPlayerIndex, 1);
                    _playerCount -= 1;

                    if (losingPlayer[0].isHuman) {
                        // Human player is dead, game over
                        humanPlayerAlive = false;
                        $("#gameMessages").html("Human player loses, Game Over!!!!");
                    } else if (_playerCount === 1) {
                        // Only one player left, end of the game we have a winner
                        $("#gameMessages").html(_players[0].name + " has WON the game!!!!");
                    }

                    if (deadPlayerIndex > 0) {
                        _dealerPos += 1;
                    }

                } else {
                    _dealerPos += 1;
                }

                // Move to next dealer position
                if (_dealerPos > (_playerCount - 1)) {
                    _dealerPos = 0;
                }

                _players[_dealerPos].isDealer = true;

                if (_playerCount > 1 && humanPlayerAlive) {

                    setTimeout(function () {
                        startTurn();
                    }, 7000);

                }
                else {

                    setTimeout(function () {
                        newGame();
                    }, 7000);
                }

            } else {

                /// Check if player is computer controlled, if so start turn
                /// Otherwise do nothing and wait for player to make his move before moving to next player (If there is one)
                if(!this.isHuman)
                {
                    // Decide which cards to swap and then move on to the next player
                    determinePlayerAction();
                }
            }
        };
    }

    function allowDrop(ev) {
        ev.preventDefault();
    }
1
    function drag(ev) {
        ev.dataTransfer.setData("text", ev.target.id);
    }

    function drop(ev) {

        if (_players[_currentPlayer].isHuman) {

            var results = [];
            ev.preventDefault();

            // Get both card Ids
            var commCardId = ev.dataTransfer.getData("text");
            var playerHoleCardId = ev.target.id;

            // Select the cards to be changed
            var holeCardToChange = _players[_currentPlayer].holeCards[playerHoleCardId];
            var commCardToChange = _communityCards[commCardId];

            // Change the community card with the player card
            _players[_currentPlayer].holeCards[playerHoleCardId] = commCardToChange;
            _communityCards[commCardId] = holeCardToChange;

            // See what the best hand is
            results.push(runHandMatrix(_players[_currentPlayer].holeCards[0], _players[_currentPlayer].holeCards[1],
            _players[_currentPlayer].holeCards[2], 0, commCardId));

            // Sort by hand strength
            results.sort(firstBy(function (a, b) {
                return b.strength - a.strength
            }).thenBy(function (a, b) { return b.highCard - a.highCard }));

            if ($("#playerHasKnocked").is(':checked') && _playerKnocked === false) {
                _players[_currentPlayer].hasKnocked = true;
                $(_players[_currentPlayer].display).append("<br/><span class='knocked'>KNOCKED</span>");
                _playerKnocked = true;
            }

            _players[_currentPlayer].selectedHand = results[0];

            swapCardMoveNextPlayer();
        }
    }

    return {
        allowDrop: allowDrop,
        drag: drag,
        drop: drop,
        swapAllPlayerCards: swapAllPlayerCards,
        newGame: newGame,
        init: init
    };

})();