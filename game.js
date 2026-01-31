// Triple Threat Casino - Slots -> Plinko -> Blackjack
class TripleThreatGame {
    constructor() {
        this.credits = 1000;
        this.bet = 10;
        this.minBet = 5;
        this.maxBet = 100;
        this.betStep = 5;

        // Game state
        this.currentStage = 'slots';
        this.plinkoBalls = 0;
        this.bonusCards = [];

        // Initialize music first
        this.initMusic();

        // Initialize all games
        this.initSlots();
        this.initPlinko();
        this.initBlackjack();
        this.bindGlobalEvents();
        this.updateDisplay();
    }

    // ==================== MUSIC SYSTEM ====================

    initMusic() {
        this.audioContext = null;
        this.musicPlaying = false;
        this.musicVolume = 0.5;
        this.musicNodes = [];

        // Bind music controls
        document.getElementById('music-toggle').addEventListener('click', () => this.toggleMusic());
        document.getElementById('volume-slider').addEventListener('input', (e) => {
            this.musicVolume = e.target.value / 100;
            this.updateMusicVolume();
        });
    }

    startAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = this.musicVolume;
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    toggleMusic() {
        const btn = document.getElementById('music-toggle');

        if (this.musicPlaying) {
            this.stopMusic();
            btn.textContent = '🔇';
            btn.classList.add('muted');
        } else {
            this.startMusic();
            btn.textContent = '🔊';
            btn.classList.remove('muted');
        }
    }

    updateMusicVolume() {
        if (this.masterGain) {
            this.masterGain.gain.value = this.musicVolume;
        }
    }

    startMusic() {
        this.startAudioContext();
        this.musicPlaying = true;
        this.playFunkyBeat();
    }

    stopMusic() {
        this.musicPlaying = false;
        this.musicNodes.forEach(node => {
            try { node.stop(); } catch(e) {}
        });
        this.musicNodes = [];
    }

    playFunkyBeat() {
        if (!this.musicPlaying) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;
        const bpm = 120;
        const beatDuration = 60 / bpm;
        const barDuration = beatDuration * 4;

        // Funky bass line pattern (notes in Hz)
        const bassNotes = [
            { note: 82.41, time: 0 },         // E2
            { note: 82.41, time: 0.5 },
            { note: 98.00, time: 1 },         // G2
            { note: 110.00, time: 1.5 },      // A2
            { note: 82.41, time: 2 },         // E2
            { note: 73.42, time: 2.5 },       // D2
            { note: 82.41, time: 3 },         // E2
            { note: 98.00, time: 3.5 },       // G2
        ];

        // Funky chord stabs
        const chordTimes = [0.25, 1.25, 2.25, 3.25];
        const chordFreqs = [329.63, 415.30, 493.88]; // E4, G#4, B4

        // Create bass notes
        bassNotes.forEach(({ note, time }) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.value = note;

            gain.gain.setValueAtTime(0.3, now + time * beatDuration);
            gain.gain.exponentialDecayTo = 0.01;
            gain.gain.setValueAtTime(0.3, now + time * beatDuration);
            gain.gain.exponentialRampToValueAtTime(0.01, now + (time + 0.4) * beatDuration);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now + time * beatDuration);
            osc.stop(now + (time + 0.5) * beatDuration);

            this.musicNodes.push(osc);
        });

        // Create chord stabs
        chordTimes.forEach(time => {
            chordFreqs.forEach(freq => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'square';
                osc.frequency.value = freq;

                gain.gain.setValueAtTime(0.1, now + time * beatDuration);
                gain.gain.exponentialRampToValueAtTime(0.01, now + (time + 0.15) * beatDuration);

                osc.connect(gain);
                gain.connect(this.masterGain);

                osc.start(now + time * beatDuration);
                osc.stop(now + (time + 0.2) * beatDuration);

                this.musicNodes.push(osc);
            });
        });

        // Hi-hat pattern
        for (let i = 0; i < 8; i++) {
            const noise = this.createNoise(ctx);
            const hihatGain = ctx.createGain();
            const hihatFilter = ctx.createBiquadFilter();

            hihatFilter.type = 'highpass';
            hihatFilter.frequency.value = 8000;

            const startTime = now + i * 0.5 * beatDuration;
            hihatGain.gain.setValueAtTime(i % 2 === 0 ? 0.1 : 0.05, startTime);
            hihatGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);

            noise.connect(hihatFilter);
            hihatFilter.connect(hihatGain);
            hihatGain.connect(this.masterGain);

            noise.start(startTime);
            noise.stop(startTime + 0.1);

            this.musicNodes.push(noise);
        }

        // Kick drum on beats 1 and 3
        [0, 2].forEach(beat => {
            const kick = ctx.createOscillator();
            const kickGain = ctx.createGain();

            kick.frequency.setValueAtTime(150, now + beat * beatDuration);
            kick.frequency.exponentialRampToValueAtTime(50, now + beat * beatDuration + 0.1);

            kickGain.gain.setValueAtTime(0.5, now + beat * beatDuration);
            kickGain.gain.exponentialRampToValueAtTime(0.01, now + beat * beatDuration + 0.2);

            kick.connect(kickGain);
            kickGain.connect(this.masterGain);

            kick.start(now + beat * beatDuration);
            kick.stop(now + beat * beatDuration + 0.3);

            this.musicNodes.push(kick);
        });

        // Snare on beats 2 and 4
        [1, 3].forEach(beat => {
            const snareNoise = this.createNoise(ctx);
            const snareGain = ctx.createGain();
            const snareFilter = ctx.createBiquadFilter();

            snareFilter.type = 'bandpass';
            snareFilter.frequency.value = 3000;

            snareGain.gain.setValueAtTime(0.3, now + beat * beatDuration);
            snareGain.gain.exponentialRampToValueAtTime(0.01, now + beat * beatDuration + 0.15);

            snareNoise.connect(snareFilter);
            snareFilter.connect(snareGain);
            snareGain.connect(this.masterGain);

            snareNoise.start(now + beat * beatDuration);
            snareNoise.stop(now + beat * beatDuration + 0.2);

            this.musicNodes.push(snareNoise);
        });

        // Schedule next bar
        setTimeout(() => {
            if (this.musicPlaying) {
                this.playFunkyBeat();
            }
        }, barDuration * 1000);
    }

    createNoise(ctx) {
        const bufferSize = ctx.sampleRate * 0.5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        return noise;
    }

    // ==================== STAGE MANAGEMENT ====================

    switchStage(stage) {
        // Update stage indicators
        document.querySelectorAll('.stage').forEach(s => {
            s.classList.remove('active');
            if (this.getStageOrder(s.dataset.stage) < this.getStageOrder(stage)) {
                s.classList.add('completed');
            }
        });
        document.querySelector(`[data-stage="${stage}"]`).classList.add('active');

        // Switch visible stage
        document.querySelectorAll('.game-stage').forEach(s => s.classList.remove('active'));
        document.getElementById(`${stage}-stage`).classList.add('active');

        this.currentStage = stage;
        this.clearMessage();
    }

    getStageOrder(stage) {
        const order = { slots: 0, plinko: 1, blackjack: 2 };
        return order[stage] || 0;
    }

    showMessage(text, type = '') {
        const msg = document.getElementById('message');
        msg.textContent = text;
        msg.className = `message ${type}`;
    }

    clearMessage() {
        const msg = document.getElementById('message');
        msg.textContent = '';
        msg.className = 'message';
    }

    updateDisplay() {
        document.getElementById('credits').textContent = this.credits;
        document.getElementById('bet-amount').textContent = this.bet;
        document.getElementById('balls-remaining').textContent = this.plinkoBalls;
    }

    bindGlobalEvents() {
        document.getElementById('play-again-btn').addEventListener('click', () => this.resetGame());
    }

    resetGame() {
        // Keep current credits instead of resetting - only reset if broke
        if (this.credits < this.minBet) {
            this.credits = 1000; // Only reset if player is out of money
        }

        // Ensure bet doesn't exceed current credits
        this.bet = Math.min(this.bet, this.credits);
        if (this.bet < this.minBet) {
            this.bet = this.minBet;
        }

        this.plinkoBalls = 0;
        this.bonusCards = [];
        this.currentStage = 'slots';

        // Reset UI
        document.getElementById('play-again-container').classList.add('hidden');
        document.getElementById('blackjack-result').textContent = '';
        document.getElementById('blackjack-result').className = 'blackjack-result';
        document.querySelectorAll('.stage').forEach(s => s.classList.remove('completed', 'active'));
        document.querySelector('[data-stage="slots"]').classList.add('active');

        this.switchStage('slots');
        this.updateDisplay();
        this.setupReelSymbols();
    }

    // ==================== SLOTS ====================

    initSlots() {
        this.symbols = [
            { emoji: '🍇', name: 'grapes', weight: 25 },
            { emoji: '🍊', name: 'orange', weight: 20 },
            { emoji: '🍋', name: 'lemon', weight: 18 },
            { emoji: '🍒', name: 'cherry', weight: 15 },
            { emoji: '7️⃣', name: 'seven', weight: 8 },
            { emoji: '💎', name: 'diamond', weight: 4 }
        ];

        this.reels = [
            document.getElementById('reel1'),
            document.getElementById('reel2'),
            document.getElementById('reel3')
        ];
        this.isSpinning = false;
        this.finalSymbols = [];

        this.setupReelSymbols();
        this.bindSlotEvents();
    }

    setupReelSymbols() {
        this.reels.forEach(reel => {
            const symbolsContainer = reel.querySelector('.symbols');
            symbolsContainer.innerHTML = '';
            symbolsContainer.style.transform = 'translateY(0)';

            for (let i = 0; i < 20; i++) {
                const symbolDiv = document.createElement('div');
                symbolDiv.className = 'symbol';
                symbolDiv.textContent = this.getRandomSymbol().emoji;
                symbolsContainer.appendChild(symbolDiv);
            }
        });
    }

    getRandomSymbol() {
        const totalWeight = this.symbols.reduce((sum, s) => sum + s.weight, 0);
        let random = Math.random() * totalWeight;

        for (const symbol of this.symbols) {
            random -= symbol.weight;
            if (random <= 0) return symbol;
        }
        return this.symbols[0];
    }

    bindSlotEvents() {
        document.getElementById('spin-btn').addEventListener('click', () => this.spin());
        document.getElementById('bet-up').addEventListener('click', () => this.changeBet(this.betStep));
        document.getElementById('bet-down').addEventListener('click', () => this.changeBet(-this.betStep));
        document.getElementById('max-bet-btn').addEventListener('click', () => this.setMaxBet());

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.currentStage === 'slots' && !this.isSpinning) {
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

    async spin() {
        if (this.isSpinning || this.credits < this.bet) return;

        this.isSpinning = true;
        document.getElementById('spin-btn').disabled = true;

        this.credits -= this.bet;
        this.updateDisplay();
        this.clearMessage();
        document.querySelector('.win-line').classList.remove('active');

        // Determine final symbols
        this.finalSymbols = [
            this.getRandomSymbol(),
            this.getRandomSymbol(),
            this.getRandomSymbol()
        ];

        await this.animateReels();
        this.checkSlotWin();

        this.isSpinning = false;
        document.getElementById('spin-btn').disabled = false;
    }

    async animateReels() {
        const durations = [1500, 2000, 2500];
        const promises = this.reels.map((reel, i) => this.animateReel(reel, i, durations[i]));
        await Promise.all(promises);
    }

    animateReel(reel, index, duration) {
        return new Promise(resolve => {
            const container = reel.querySelector('.symbols');
            const symbols = container.querySelectorAll('.symbol');
            const symbolHeight = 100;
            const finalPos = symbols.length - 3;

            symbols[finalPos].textContent = this.finalSymbols[index].emoji;
            reel.classList.add('spinning');

            const startTime = Date.now();
            const totalDistance = (symbols.length - 4) * symbolHeight;

            const randomize = setInterval(() => {
                symbols.forEach((s, i) => {
                    if (i !== finalPos) s.textContent = this.getRandomSymbol().emoji;
                });
            }, 50);

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const ease = 1 - Math.pow(1 - progress, 3);

                container.style.transform = `translateY(-${ease * totalDistance}px)`;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    reel.classList.remove('spinning');
                    clearInterval(randomize);
                    resolve();
                }
            };

            setTimeout(() => clearInterval(randomize), duration - 200);
            requestAnimationFrame(animate);
        });
    }

    checkSlotWin() {
        const s = this.finalSymbols;
        let balls = 1; // Minimum 1 ball to continue
        let message = '';
        let type = '';

        // Three of a kind
        if (s[0].name === s[1].name && s[1].name === s[2].name) {
            document.querySelector('.win-line').classList.add('active');

            if (s[0].name === 'diamond') {
                balls = 5;
                message = '💎 JACKPOT! 5 Plinko Balls! 💎';
                type = 'jackpot';
            } else if (s[0].name === 'seven') {
                balls = 4;
                message = '7️⃣ BIG WIN! 4 Plinko Balls! 7️⃣';
                type = 'jackpot';
            } else {
                balls = 3;
                message = `🎊 Three ${s[0].emoji}! 3 Plinko Balls!`;
                type = 'win';
            }
        }
        // Two of any kind
        else if (s[0].name === s[1].name || s[1].name === s[2].name || s[0].name === s[2].name) {
            balls = 2;
            message = '✨ Pair! 2 Plinko Balls!';
            type = 'win';
        }
        else {
            message = '1 Plinko Ball - Moving to Plinko!';
        }

        this.plinkoBalls = balls;
        this.updateDisplay();
        this.showMessage(message, type);

        // Transition to Plinko after delay
        setTimeout(() => {
            this.switchStage('plinko');
            this.initPlinkoBoard();
        }, 2000);
    }

    // ==================== PLINKO ====================

    initPlinko() {
        this.canvas = document.getElementById('plinko-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.plinkoSlots = ['2', '3', '4', '5', 'A', '5', '4', '3', '2'];
        this.plinkoBall = null;
        this.plinkoPegs = [];
        this.isDropping = false;

        this.bindPlinkoEvents();
    }

    initPlinkoBoard() {
        // Create pegs
        this.plinkoPegs = [];
        const rows = 10;
        const startY = 50;
        const rowHeight = 40;

        for (let row = 0; row < rows; row++) {
            const pegsInRow = row + 3;
            const rowWidth = (pegsInRow - 1) * 40;
            const startX = (this.canvas.width - rowWidth) / 2;

            for (let peg = 0; peg < pegsInRow; peg++) {
                this.plinkoPegs.push({
                    x: startX + peg * 40,
                    y: startY + row * rowHeight,
                    radius: 6
                });
            }
        }

        this.drawPlinkoBoard();
        this.updateDisplay();

        document.getElementById('drop-btn').disabled = false;
        document.getElementById('plinko-cards').innerHTML = '';
    }

    drawPlinkoBoard() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw pegs
        this.plinkoPegs.forEach(peg => {
            this.ctx.beginPath();
            this.ctx.arc(peg.x, peg.y, peg.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = '#ffd700';
            this.ctx.fill();
            this.ctx.strokeStyle = '#cc9900';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });

        // Draw ball if exists
        if (this.plinkoBall) {
            this.ctx.beginPath();
            this.ctx.arc(this.plinkoBall.x, this.plinkoBall.y, 12, 0, Math.PI * 2);
            this.ctx.fillStyle = '#ff6b6b';
            this.ctx.fill();
            this.ctx.strokeStyle = '#cc4444';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }

    bindPlinkoEvents() {
        document.getElementById('drop-btn').addEventListener('click', () => this.dropBall());
        document.getElementById('skip-plinko-btn').addEventListener('click', () => this.skipToPlinko());
    }

    skipToPlinko() {
        this.plinkoBalls = 0;
        this.startBlackjack();
    }

    dropBall() {
        if (this.isDropping || this.plinkoBalls <= 0) return;

        this.isDropping = true;
        document.getElementById('drop-btn').disabled = true;

        this.plinkoBall = {
            x: this.canvas.width / 2 + (Math.random() - 0.5) * 40,
            y: 20,
            vx: 0,
            vy: 0
        };

        this.animatePlinkoBall();
    }

    animatePlinkoBall() {
        const gravity = 0.3;
        const bounce = 0.7;
        const friction = 0.99;

        const animate = () => {
            // Apply gravity
            this.plinkoBall.vy += gravity;
            this.plinkoBall.vx *= friction;

            // Update position
            this.plinkoBall.x += this.plinkoBall.vx;
            this.plinkoBall.y += this.plinkoBall.vy;

            // Wall collision
            if (this.plinkoBall.x < 20) {
                this.plinkoBall.x = 20;
                this.plinkoBall.vx *= -bounce;
            }
            if (this.plinkoBall.x > this.canvas.width - 20) {
                this.plinkoBall.x = this.canvas.width - 20;
                this.plinkoBall.vx *= -bounce;
            }

            // Peg collision
            this.plinkoPegs.forEach(peg => {
                const dx = this.plinkoBall.x - peg.x;
                const dy = this.plinkoBall.y - peg.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const minDist = 12 + peg.radius;

                if (dist < minDist) {
                    // Normalize collision vector
                    const nx = dx / dist;
                    const ny = dy / dist;

                    // Move ball outside peg
                    this.plinkoBall.x = peg.x + nx * minDist;
                    this.plinkoBall.y = peg.y + ny * minDist;

                    // Reflect velocity with randomness
                    const dot = this.plinkoBall.vx * nx + this.plinkoBall.vy * ny;
                    this.plinkoBall.vx = (this.plinkoBall.vx - 2 * dot * nx) * bounce + (Math.random() - 0.5) * 2;
                    this.plinkoBall.vy = (this.plinkoBall.vy - 2 * dot * ny) * bounce;
                }
            });

            this.drawPlinkoBoard();

            // Check if reached bottom
            if (this.plinkoBall.y >= this.canvas.height - 20) {
                this.landBall();
            } else {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    landBall() {
        // Determine which slot
        const slotWidth = this.canvas.width / 9;
        const slotIndex = Math.min(8, Math.max(0, Math.floor(this.plinkoBall.x / slotWidth)));
        const cardValue = this.plinkoSlots[slotIndex];

        // Highlight slot
        const slots = document.querySelectorAll('.plinko-slot');
        slots[slotIndex].classList.add('highlight');
        setTimeout(() => slots[slotIndex].classList.remove('highlight'), 500);

        // Add card to collection
        this.bonusCards.push(cardValue);
        this.addPlinkoCard(cardValue);

        this.plinkoBall = null;
        this.plinkoBalls--;
        this.updateDisplay();
        this.drawPlinkoBoard();

        this.isDropping = false;

        // Check if done with Plinko
        if (this.plinkoBalls <= 0) {
            this.showMessage('All balls dropped! Moving to Blackjack...', 'win');
            setTimeout(() => this.startBlackjack(), 1500);
        } else {
            document.getElementById('drop-btn').disabled = false;
            this.showMessage(`Got a ${cardValue}! ${this.plinkoBalls} balls remaining.`);
        }
    }

    addPlinkoCard(value) {
        const container = document.getElementById('plinko-cards');
        const card = document.createElement('div');
        card.className = 'mini-card';
        card.textContent = value;
        container.appendChild(card);
    }

    // ==================== BLACKJACK ====================

    initBlackjack() {
        this.deck = [];
        this.playerHand = [];
        this.dealerHand = [];
        this.gameOver = false;
        this.usedBonusCards = [];

        this.bindBlackjackEvents();
    }

    bindBlackjackEvents() {
        document.getElementById('hit-btn').addEventListener('click', () => this.hit());
        document.getElementById('stand-btn').addEventListener('click', () => this.stand());
        document.getElementById('use-bonus-btn').addEventListener('click', () => this.useNextBonusCard());
    }

    startBlackjack() {
        this.switchStage('blackjack');

        // Create and shuffle deck
        this.createDeck();
        this.shuffleDeck();

        // Reset hands
        this.playerHand = [];
        this.dealerHand = [];
        this.gameOver = false;
        this.usedBonusCards = [];

        // Display bonus cards
        this.displayBonusCards();

        // Deal initial cards
        this.dealInitialCards();

        this.updateBlackjackUI();
        this.enableBlackjackControls(true);
    }

    createDeck() {
        this.deck = [];
        const suits = ['♠', '♥', '♦', '♣'];
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

        for (const suit of suits) {
            for (const value of values) {
                this.deck.push({ value, suit });
            }
        }
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    dealInitialCards() {
        this.playerHand.push(this.drawCard());
        this.dealerHand.push(this.drawCard());
        this.playerHand.push(this.drawCard());
        this.dealerHand.push({ ...this.drawCard(), hidden: true });
    }

    drawCard() {
        return this.deck.pop();
    }

    displayBonusCards() {
        const container = document.getElementById('bonus-cards');
        container.innerHTML = '';

        this.bonusCards.forEach((value, index) => {
            const card = document.createElement('div');
            card.className = 'mini-card';
            card.textContent = value;
            card.dataset.index = index;
            card.addEventListener('click', () => this.useBonusCard(index));
            container.appendChild(card);
        });

        this.updateBonusButton();
    }

    updateBonusButton() {
        const availableBonus = this.bonusCards.filter((_, i) => !this.usedBonusCards.includes(i));
        document.getElementById('use-bonus-btn').disabled = availableBonus.length === 0 || this.gameOver;
    }

    useBonusCard(index) {
        if (this.usedBonusCards.includes(index) || this.gameOver) return;

        const value = this.bonusCards[index];
        this.usedBonusCards.push(index);

        // Mark card as used
        const cards = document.querySelectorAll('#bonus-cards .mini-card');
        cards[index].classList.add('used');

        // Add to player hand with random suit
        const suits = ['♠', '♥', '♦', '♣'];
        const suit = suits[Math.floor(Math.random() * suits.length)];
        this.playerHand.push({ value, suit, bonus: true });

        this.updateBlackjackUI();
        this.updateBonusButton();

        // Check for bust
        if (this.calculateHand(this.playerHand) > 21) {
            this.endBlackjack('bust');
        }
    }

    useNextBonusCard() {
        const nextIndex = this.bonusCards.findIndex((_, i) => !this.usedBonusCards.includes(i));
        if (nextIndex !== -1) {
            this.useBonusCard(nextIndex);
        }
    }

    hit() {
        if (this.gameOver) return;

        this.playerHand.push(this.drawCard());
        this.updateBlackjackUI();

        if (this.calculateHand(this.playerHand) > 21) {
            this.endBlackjack('bust');
        }
    }

    stand() {
        if (this.gameOver) return;

        // Reveal dealer card
        this.dealerHand[1].hidden = false;
        this.updateBlackjackUI();

        // Dealer draws until 17
        this.dealerPlay();
    }

    async dealerPlay() {
        this.enableBlackjackControls(false);

        while (this.calculateHand(this.dealerHand) < 17) {
            await this.delay(500);
            this.dealerHand.push(this.drawCard());
            this.updateBlackjackUI();
        }

        this.determineWinner();
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    calculateHand(hand) {
        let total = 0;
        let aces = 0;

        for (const card of hand) {
            if (card.hidden) continue;

            if (card.value === 'A') {
                aces++;
                total += 11;
            } else if (['K', 'Q', 'J'].includes(card.value)) {
                total += 10;
            } else {
                total += parseInt(card.value);
            }
        }

        // Adjust for aces
        while (total > 21 && aces > 0) {
            total -= 10;
            aces--;
        }

        return total;
    }

    determineWinner() {
        const playerScore = this.calculateHand(this.playerHand);
        const dealerScore = this.calculateHand(this.dealerHand);

        if (dealerScore > 21) {
            this.endBlackjack('dealer-bust');
        } else if (playerScore > dealerScore) {
            this.endBlackjack('win');
        } else if (playerScore < dealerScore) {
            this.endBlackjack('lose');
        } else {
            this.endBlackjack('push');
        }
    }

    endBlackjack(result) {
        this.gameOver = true;
        this.enableBlackjackControls(false);

        const resultDiv = document.getElementById('blackjack-result');
        let winnings = 0;

        switch (result) {
            case 'bust':
                resultDiv.textContent = '💥 BUST! You lose!';
                resultDiv.className = 'blackjack-result lose';
                break;
            case 'dealer-bust':
                winnings = this.bet * 2;
                resultDiv.textContent = `🎉 Dealer busts! You win ${winnings} credits!`;
                resultDiv.className = 'blackjack-result win';
                break;
            case 'win':
                winnings = this.bet * 2;
                resultDiv.textContent = `🎊 YOU WIN ${winnings} credits!`;
                resultDiv.className = 'blackjack-result win';
                break;
            case 'lose':
                resultDiv.textContent = '😔 Dealer wins!';
                resultDiv.className = 'blackjack-result lose';
                break;
            case 'push':
                winnings = this.bet;
                resultDiv.textContent = '🤝 Push! Bet returned.';
                resultDiv.className = 'blackjack-result push';
                break;
        }

        this.credits += winnings;
        this.updateDisplay();

        // Show play again button
        document.getElementById('play-again-container').classList.remove('hidden');

        // Final message
        setTimeout(() => {
            if (this.credits < this.minBet) {
                this.showMessage('Game Over! Out of credits!', 'lose');
            } else {
                this.showMessage(`Round complete! Credits: ${this.credits}`, 'win');
            }
        }, 500);
    }

    enableBlackjackControls(enabled) {
        document.getElementById('hit-btn').disabled = !enabled;
        document.getElementById('stand-btn').disabled = !enabled;
        this.updateBonusButton();
    }

    updateBlackjackUI() {
        // Update dealer cards
        const dealerContainer = document.getElementById('dealer-cards');
        dealerContainer.innerHTML = '';
        this.dealerHand.forEach(card => {
            dealerContainer.appendChild(this.createCardElement(card));
        });

        // Update player cards
        const playerContainer = document.getElementById('player-cards');
        playerContainer.innerHTML = '';
        this.playerHand.forEach(card => {
            playerContainer.appendChild(this.createCardElement(card));
        });

        // Update scores
        const dealerScore = this.calculateHand(this.dealerHand);
        const playerScore = this.calculateHand(this.playerHand);

        document.getElementById('dealer-score').textContent =
            this.dealerHand.some(c => c.hidden) ? `(${this.calculateHand([this.dealerHand[0]])})` : `(${dealerScore})`;
        document.getElementById('player-score').textContent = `(${playerScore})`;
    }

    createCardElement(card) {
        const div = document.createElement('div');
        const isRed = card.suit === '♥' || card.suit === '♦';

        div.className = `card ${card.hidden ? 'hidden' : (isRed ? 'red' : 'black')}`;
        if (card.bonus) div.classList.add('bonus');

        if (!card.hidden) {
            div.innerHTML = `
                <span class="value">${card.value}</span>
                <span class="suit">${card.suit}</span>
            `;
        }

        return div;
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TripleThreatGame();
});
