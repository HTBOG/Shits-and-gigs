// Slot Machine Game
class SlotMachine {
    constructor() {
        // Symbols with their weights (higher weight = more common)
        this.symbols = [
            { emoji: '🍇', name: 'grapes', weight: 25 },
            { emoji: '🍊', name: 'orange', weight: 20 },
            { emoji: '🍋', name: 'lemon', weight: 18 },
            { emoji: '🍒', name: 'cherry', weight: 15 },
            { emoji: '7️⃣', name: 'seven', weight: 8 },
            { emoji: '💎', name: 'diamond', weight: 4 }
        ];

        // Payouts for matching symbols (multiplier of bet)
        this.payouts = {
            'diamond': 100,
            'seven': 50,
            'cherry': 25,
            'lemon': 15,
            'orange': 10,
            'grapes': 5
        };

        // Game state
        this.credits = 1000;
        this.bet = 10;
        this.minBet = 5;
        this.maxBet = 100;
        this.betStep = 5;
        this.isSpinning = false;

        // DOM elements
        this.reels = [
            document.getElementById('reel1'),
            document.getElementById('reel2'),
            document.getElementById('reel3')
        ];
        this.creditsDisplay = document.getElementById('credits');
        this.betDisplay = document.getElementById('bet-amount');
        this.messageDisplay = document.getElementById('message');
        this.spinButton = document.getElementById('spin-btn');
        this.betUpButton = document.getElementById('bet-up');
        this.betDownButton = document.getElementById('bet-down');
        this.maxBetButton = document.getElementById('max-bet-btn');
        this.winLine = document.querySelector('.win-line');
        this.gameContainer = document.querySelector('.game-container');

        // Current reel positions (for animation)
        this.reelPositions = [0, 0, 0];
        this.finalSymbols = ['', '', ''];

        this.init();
    }

    init() {
        this.setupReelSymbols();
        this.bindEvents();
        this.updateDisplay();
    }

    setupReelSymbols() {
        // Create a strip of symbols for each reel
        this.reels.forEach((reel, index) => {
            const symbolsContainer = reel.querySelector('.symbols');
            symbolsContainer.innerHTML = '';

            // Create enough symbols for smooth animation (20 symbols per reel)
            for (let i = 0; i < 20; i++) {
                const symbolDiv = document.createElement('div');
                symbolDiv.className = 'symbol';
                symbolDiv.textContent = this.getRandomSymbol().emoji;
                symbolsContainer.appendChild(symbolDiv);
            }
        });
    }

    getRandomSymbol() {
        // Weighted random selection
        const totalWeight = this.symbols.reduce((sum, s) => sum + s.weight, 0);
        let random = Math.random() * totalWeight;

        for (const symbol of this.symbols) {
            random -= symbol.weight;
            if (random <= 0) {
                return symbol;
            }
        }
        return this.symbols[0];
    }

    bindEvents() {
        this.spinButton.addEventListener('click', () => this.spin());
        this.betUpButton.addEventListener('click', () => this.changeBet(this.betStep));
        this.betDownButton.addEventListener('click', () => this.changeBet(-this.betStep));
        this.maxBetButton.addEventListener('click', () => this.setMaxBet());

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isSpinning) {
                e.preventDefault();
                this.spin();
            }
        });
    }

    changeBet(amount) {
        if (this.isSpinning) return;

        const newBet = this.bet + amount;
        if (newBet >= this.minBet && newBet <= this.maxBet && newBet <= this.credits) {
            this.bet = newBet;
            this.updateDisplay();
        }
    }

    setMaxBet() {
        if (this.isSpinning) return;

        this.bet = Math.min(this.maxBet, this.credits);
        this.updateDisplay();
    }

    updateDisplay() {
        this.creditsDisplay.textContent = this.credits;
        this.betDisplay.textContent = this.bet;

        // Disable spin if not enough credits
        this.spinButton.disabled = this.credits < this.bet || this.isSpinning;
    }

    async spin() {
        if (this.isSpinning || this.credits < this.bet) return;

        this.isSpinning = true;
        this.spinButton.disabled = true;
        this.spinButton.classList.add('spinning');

        // Deduct bet
        this.credits -= this.bet;
        this.updateDisplay();

        // Clear previous messages
        this.messageDisplay.textContent = '';
        this.messageDisplay.className = 'message';
        this.winLine.classList.remove('active');

        // Determine final symbols
        this.finalSymbols = [
            this.getRandomSymbol(),
            this.getRandomSymbol(),
            this.getRandomSymbol()
        ];

        // Animate reels
        await this.animateReels();

        // Check for wins
        this.checkWin();

        this.isSpinning = false;
        this.spinButton.classList.remove('spinning');
        this.updateDisplay();
    }

    async animateReels() {
        const spinDurations = [1500, 2000, 2500]; // Different durations for each reel
        const promises = this.reels.map((reel, index) =>
            this.animateReel(reel, index, spinDurations[index])
        );

        await Promise.all(promises);
    }

    animateReel(reel, index, duration) {
        return new Promise((resolve) => {
            const symbolsContainer = reel.querySelector('.symbols');
            const symbolHeight = 120; // Height of each symbol
            const symbols = symbolsContainer.querySelectorAll('.symbol');

            // Add spinning class
            reel.classList.add('spinning');

            // Reset position
            let position = 0;
            const startTime = Date.now();
            const totalSymbols = symbols.length;

            // Set the final symbol at a specific position
            const finalPosition = totalSymbols - 3; // Landing position
            symbols[finalPosition].textContent = this.finalSymbols[index].emoji;

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Easing function for smooth deceleration
                const easeOut = 1 - Math.pow(1 - progress, 3);

                // Calculate target position
                const totalDistance = (totalSymbols - 4) * symbolHeight;
                position = easeOut * totalDistance;

                symbolsContainer.style.transform = `translateY(-${position}px)`;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    reel.classList.remove('spinning');
                    resolve();
                }
            };

            // Randomize other symbols during spin
            const randomizeInterval = setInterval(() => {
                symbols.forEach((symbol, i) => {
                    if (i !== finalPosition) {
                        symbol.textContent = this.getRandomSymbol().emoji;
                    }
                });
            }, 50);

            setTimeout(() => clearInterval(randomizeInterval), duration - 200);

            requestAnimationFrame(animate);
        });
    }

    checkWin() {
        const symbols = this.finalSymbols;
        let winAmount = 0;
        let message = '';
        let messageClass = 'lose';

        // Check for three of a kind
        if (symbols[0].name === symbols[1].name && symbols[1].name === symbols[2].name) {
            const multiplier = this.payouts[symbols[0].name];
            winAmount = this.bet * multiplier;

            if (symbols[0].name === 'diamond') {
                message = `💎 JACKPOT! 💎 +${winAmount}`;
                messageClass = 'jackpot';
            } else if (symbols[0].name === 'seven') {
                message = `🎉 BIG WIN! 🎉 +${winAmount}`;
                messageClass = 'jackpot';
            } else {
                message = `🎊 WIN! +${winAmount}`;
                messageClass = 'win';
            }
        }
        // Check for two cherries (partial win)
        else if (symbols.filter(s => s.name === 'cherry').length === 2) {
            winAmount = this.bet * 2;
            message = `🍒 Small win! +${winAmount}`;
            messageClass = 'win';
        }
        else {
            message = 'Try again!';
        }

        if (winAmount > 0) {
            this.credits += winAmount;
            this.winLine.classList.add('active');
            this.gameContainer.classList.add('celebrating');
            setTimeout(() => this.gameContainer.classList.remove('celebrating'), 500);
        }

        this.messageDisplay.textContent = message;
        this.messageDisplay.className = `message ${messageClass}`;

        // Check for game over
        if (this.credits < this.minBet) {
            setTimeout(() => {
                this.messageDisplay.textContent = 'Game Over! Refresh to play again.';
                this.messageDisplay.className = 'message lose';
            }, 1500);
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SlotMachine();
});
