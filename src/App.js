import { useState, useEffect } from 'react';
import './App.css'; // CSS-Modul für besseres Design

const API_BASE = "https://deckofcardsapi.com/api/deck";

export default function Blackjack() {
    const [deckId, setDeckId] = useState(null);
    const [playerHand, setPlayerHand] = useState([]);
    const [dealerHand, setDealerHand] = useState([]);
    const [gameOver, setGameOver] = useState(false);
    const [message, setMessage] = useState("Start a new game!");

    useEffect(() => {
        startNewGame();
    }, []);

    const startNewGame = async () => {
        const res = await fetch(`${API_BASE}/new/shuffle/?deck_count=1`);
        const data = await res.json();
        setDeckId(data.deck_id);
        setPlayerHand([]);
        setDealerHand([]);
        setGameOver(false);
        setMessage("Game started! Draw cards.");
        setTimeout(async () => {
            await drawCard(false);
            await drawCard(false);
            await drawCard(true);
            await drawCard(true);
        }, 500);
    };

    const drawCard = async (isDealer = false) => {
        if (!deckId) return;
        const res = await fetch(`${API_BASE}/${deckId}/draw/?count=1`);
        const data = await res.json();
        if (data.cards.length > 0) {
            const card = data.cards[0];
            if (isDealer) {
                setDealerHand(prev => [...prev, card]);
            } else {
                setPlayerHand(prev => [...prev, card]);
            }
        }
    };

    const calculateScore = (hand) => {
        let score = 0;
        let aceCount = 0;
        
        hand.forEach(card => {
            let value = card.value;
            if (["KING", "QUEEN", "JACK"].includes(value)) {
                score += 10;
            } else if (value === "ACE") {
                aceCount += 1;
                score += 11;
            } else {
                score += parseInt(value);
            }
        });
        
        while (score > 21 && aceCount > 0) {
            score -= 10;
            aceCount -= 1;
        }
        
        return score;
    };

    const handleStand = async () => {
        let dealerScore = calculateScore(dealerHand);
        while (dealerScore < 17) {
            await drawCard(true);
            dealerScore = calculateScore([...dealerHand]);
        }
        determineWinner();
    };

    const determineWinner = () => {
        const playerScore = calculateScore(playerHand);
        const dealerScore = calculateScore(dealerHand);
        let result;
        
        if (playerScore > 21) {
            result = "You bust! Dealer wins.";
        } else if (dealerScore > 21 || playerScore > dealerScore) {
            result = "You win!";
        } else if (playerScore === dealerScore) {
            result = "It's a tie!";
        } else {
            result = "Dealer wins!";
        }
        
        setMessage(result);
        setGameOver(true);
    };

    return (
        <div className="container">
            <h1 className="title">Blackjack</h1>
            <p className="message">{message}</p>
            <div className="buttons">
                <button onClick={startNewGame} disabled={!gameOver} className="button">New Game</button>
                <button onClick={() => drawCard(false)} disabled={gameOver} className="button">Hit</button>
                <button onClick={handleStand} disabled={gameOver} className="button">Stand</button>
            </div>
            <div className="hands">
                <div className="hand">
                    <h2>Player's Hand ({calculateScore(playerHand)})</h2>
                    <div className="cards">{playerHand.map(card => <img key={card.code} src={card.image} alt={card.value} className="card" />)}</div>
                </div>
                <div className="hand">
                    <h2>Dealer's Hand ({calculateScore(dealerHand)})</h2>
                    <div className="cards">{dealerHand.map(card => <img key={card.code} src={card.image} alt={card.value} className="card" />)}</div>
                </div>
            </div>
        </div>
    );
}
