// Logger class to handle different levels of logging (ERROR, WARN, INFO, DEBUG)
class Logger {
    // Define log levels in order of severity
    static LEVELS = {
        ERROR: 0,  // Most severe - for errors that break functionality
        WARN: 1,   // For potential issues that don't break the game
        INFO: 2,   // For important game events
        DEBUG: 3   // For detailed debugging information
    };

    // Only log messages at or below this level
    static currentLevel = this.LEVELS.INFO;

    // Main logging function with timestamp and optional data
    static log(level, message, data = null) {
        if (level > this.currentLevel) return;

        const timestamp = new Date().toISOString();
        const logMessage = data ?
            `[${timestamp}] ${message} | ${JSON.stringify(data)}` :
            `[${timestamp}] ${message}`;

        switch (level) {
            case this.LEVELS.ERROR:
                console.error(logMessage);
                break;
            case this.LEVELS.WARN:
                console.warn(logMessage);
                break;
            case this.LEVELS.INFO:
                console.info(logMessage);
                break;
            case this.LEVELS.DEBUG:
                console.debug(logMessage);
                break;
        }
    }
}

// GameState class to manage all game data and persistence
class GameState {
    constructor() {
        // Initialize game state with default values
        this.clicks = 0;            // Total clicks
        this.autoClickers = 0;      // Number of auto clickers owned
        this.multiplier = 1;        // Click multiplier value
        this.autoClickerCost = 1000000;  // Base cost for auto clicker
        this.multiplierCost = 10;   // Base cost for multiplier

        // Load saved player name or use default
        this.playerName = localStorage.getItem('playerName');

        // Load saved skin or use default 'aren'
        this.currentSkin = localStorage.getItem('currentSkin') || 'aren';

        // Load unlocked skins or start with default 'aren'
        this.unlockedSkins = localStorage.getItem('unlockedSkins') ?
            JSON.parse(localStorage.getItem('unlockedSkins')) : ['aren'];

        // Sigma mode state
        this.isSigmaModeUnlocked = localStorage.getItem('isSigmaModeUnlocked') === 'true';
    }

    // Save game state to localStorage
    save() {
        try {
            const state = {
                clicks: this.clicks,
                autoClickers: this.autoClickers,
                multiplier: this.multiplier,
                autoClickerCost: this.autoClickerCost,
                multiplierCost: this.multiplierCost,
                playerName: this.playerName,
                currentSkin: this.currentSkin,
                unlockedSkins: this.unlockedSkins,
                isSigmaModeUnlocked: this.isSigmaModeUnlocked // Save sigma mode state
            };
            localStorage.setItem('gameState', JSON.stringify(state));
            localStorage.setItem('unlockedSkins', JSON.stringify(this.unlockedSkins));
            Logger.log(Logger.LEVELS.DEBUG, 'Game state saved');
        } catch (error) {
            Logger.log(Logger.LEVELS.ERROR, 'Failed to save game state', { error: error.message });
        }
    }

    // Load game state from localStorage
    load() {
        try {
            const savedState = localStorage.getItem('gameState');
            if (savedState) {
                const state = JSON.parse(savedState);
                this.clicks = parseFloat(state.clicks) || 0;
                this.autoClickers = parseInt(state.autoClickers) || 0;
                this.multiplier = parseFloat(state.multiplier) || 1;

                // Use the saved auto clicker cost instead of recalculating
                this.autoClickerCost = parseFloat(state.autoClickerCost) || 1000000;

                this.multiplierCost = parseFloat(state.multiplierCost) || 10;
                this.playerName = state.playerName || '';
                this.currentSkin = state.currentSkin || 'aren';
                this.unlockedSkins = state.unlockedSkins || ['aren'];
                this.isSigmaModeUnlocked = state.isSigmaModeUnlocked || false; // Load sigma mode state

                Logger.log(Logger.LEVELS.INFO, 'Game state loaded', {
                    clicks: this.clicks,
                    autoClickers: this.autoClickers,
                    autoClickerCost: this.autoClickerCost
                });
            }
        } catch (error) {
            Logger.log(Logger.LEVELS.ERROR, 'Failed to load game state', { error: error.message });
        }
    }
}

// Main Game class to handle game logic and UI
class Game {
    constructor() {
        // Initialize game state
        this.state = new GameState();

        // Sigma Mode variables
        this.sigmaCode = 'sigmaboy';
        this.typedCode = '';

        // Define all available skins with their properties
        this.skinImages = {
            // Default
            aren: { normal: './skins/click1.jpg', click: './skins/click2.jpg', cost: 0, name: 'Aren' },
            // Reward
            antonsa: { normal: './skins/antonsa1.jpg', click: './skins/antonsa2.jpg', cost: -100000, name: 'Anton SA', isReward: true }, // Cost is negative to signify reward amount
            // Normal skins, ordered by increasing cost (matching HTML from previous step)
            messi: { normal: './skins/messi1.jpg', click: './skins/messi2.jpg', cost: 10000, name: 'Messi' },
            cr7: { normal: './skins/ronaldo1.jpg', click: './skins/ronaldo2.jpg', cost: 100000, name: 'CR7' },
            anton3: { normal: './skins/anton31.jpg', click: './skins/anton32.jpg', cost: 1000000, name: 'Anton 3' },
            casper2: { normal: './skins/casper21.jpg', click: './skins/casper22.jpg', cost: 1000000, name: 'Casper 2' },
            matteo: { normal: './skins/matteo1.jpg', click: './skins/matteo2.jpg', cost: 1000000, name: 'Matteo' },
            unknown: { normal: './skins/unknown1.jpg', click: './skins/unknown2.jpg', cost: 1000000, name: 'Unknown Name' },
            casper: { normal: './skins/casper1.jpg', click: './skins/casper2.jpg', cost: 10000000, name: 'Casper' },
            eliot: { normal: './skins/eliot1.jpg', click: './skins/eliot2.jpg', cost: 10000000, name: 'Eliot' },
            emil: { normal: './skins/emil1.jpg', click: './skins/emil2.jpg', cost: 10000000, name: 'Emil' },
            gabbe: { normal: './skins/gabbe1.jpg', click: './skins/gabbe2.jpg', cost: 10000000, name: 'Gabbe' },
            julle: { normal: './skins/julle1.jpg', click: './skins/julle2.jpg', cost: 10000000, name: 'Julle' },
            levi: { normal: './skins/levi1.jpg', click: './skins/levi2.jpg', cost: 10000000, name: 'Levi' },
            luddain: { normal: './skins/luddain1.jpg', click: './skins/luddain2.jpg', cost: 10000000, name: 'Luddain' },
            ludvig: { normal: './skins/ludvig1.jpg', click: './skins/ludvig2.jpg', cost: 10000000, name: 'Ludvig' },
            malte: { normal: './skins/malte1.jpg', click: './skins/malte2.jpg', cost: 10000000, name: 'Malte' },
            ollibolly: { normal: './skins/ollibolly1.jpg', click: './skins/ollibolly2.jpg', cost: 10000000, name: 'Ollibolly' },
            seth: { normal: './skins/seth1.jpg', click: './skins/seth2.jpg', cost: 10000000, name: 'Seth' },
            sixten: { normal: './skins/sixten1.jpg', click: './skins/sixten2.jpg', cost: 10000000, name: 'Sixten' },
            timma: { normal: './skins/timma1.jpg', click: './skins/timma2.jpg', cost: 10000000, name: 'Timma' },
            wirre: { normal: './skins/wirre1.jpg', click: './skins/wirre2.jpg', cost: 10000000, name: 'Wirre' },
            ture: { normal: './skins/ture1.jpg', click: './skins/ture2.jpg', cost: 100000000, name: 'Ture' },
            antonsc: { normal: './skins/antonsc1.jpg', click: './skins/antonsc2.jpg', cost: 1000000000, name: 'Anton SC' },
            axel: { normal: './skins/axel1.jpg', click: './skins/axel2.jpg', cost: 1000000000, name: 'Axel' },
            emilstekman: { normal: './skins/emilstekman1.jpg', click: './skins/emilstekman2.jpg', cost: 1000000000, name: 'EmilStekman' },
            // Sigma Skin (as per context, though not explicitly marked as 'sigma' type in this structure)
            henry: { normal: './skins/henri1.jpg', click: './skins/henri2.jpg', cost: 1000000000000, name: 'Henry' }, // 1 Trillion
            ask: { normal: './skins/ask1.jpg', click: './skins/ask2.jpg', cost: 1e15, name: 'Ask' }, // 1 Quadrillion
            albin: { normal: './skins/albin1.jpg', click: './skins/albin2.jpg', cost: 1e27, name: 'Albin' }  // 1 Octillion
        };

        // Load saved state
        this.state.load();

        // Detect Safari browser for audio handling
        this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

        // Set update intervals
        this.UPDATE_INTERVAL = this.isSafari ? 2000 : 1000;
        this.lastUpdateTime = Date.now();
        this.pendingClicks = 0;
        this.currentAudio = 0;

        this.ronaldoSound = new Audio('ronaldo.mp3');
        this.ronaldoSound.volume = 0.2;  // Adjust volume as needed

        this.SAVE_INTERVAL = 5000; // Save every 5 seconds
        this.lastSaveTime = Date.now();

        // Initialize game components
        this.initializeElements();    // Get DOM elements
        this.initializeAudio();       // Set up sound effects
        this.initializeImages();      // Load skin images
        this.setupEventListeners();   // Set up user interactions
        this.setupLeaderboard();      // Initialize leaderboard

        // Ensure all modals are closed after elements are initialized and before any other logic
        this.closeAllModals();

        this.updateButtonStates();    // Update initial UI state

        // Show Sigma Skins button if already unlocked from previous session
        if (this.state.isSigmaModeUnlocked && this.elements.sigmaSkinsBtn) {
            this.elements.sigmaSkinsBtn.style.display = 'block';
        }
    }

    numberToWords(num) {
        const intNum = Math.floor(num);

        if (intNum === 0) return "Zero";
        if (typeof intNum !== 'number' || isNaN(intNum) || intNum < 0) return "";

        const units = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
        const tensArray = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

        const convertChunkToWords = (n) => { // Converts a number < 1000 to words
            if (n === 0) return "";
            let word = "";
            if (n >= 100) {
                word += units[Math.floor(n / 100)] + " hundred";
                n %= 100;
                if (n > 0) word += " ";
            }
            if (n > 0) {
                if (n < 20) {
                    word += units[n];
                } else {
                    word += tensArray[Math.floor(n / 10)];
                    if (n % 10 > 0) {
                        word += "-" + units[n % 10];
                    }
                }
            }
            return word;
        };

        const scales = [
            { name: "octillion", value: 1e27 }, { name: "septillion", value: 1e24 },
            { name: "sextillion", value: 1e21 }, { name: "quintillion", value: 1e18 },
            { name: "quadrillion", value: 1e15 }, { name: "trillion", value: 1e12 },
            { name: "billion", value: 1e9 }, { name: "million", value: 1e6 },
            { name: "thousand", value: 1e3 }, { name: "", value: 1 } // Base case for < 1000
        ];

        let resultWords = [];
        let remainingNum = intNum;

        for (const scale of scales) {
            if (remainingNum >= scale.value && scale.value > 0) { // Ensure scale.value is positive
                const countForScale = Math.floor(remainingNum / scale.value);
                if (countForScale > 0) {
                    resultWords.push(convertChunkToWords(countForScale) + (scale.name ? " " + scale.name : ""));
                    remainingNum %= scale.value;
                }
            }
        }

        let finalStr = resultWords.join(" ").trim();
        return finalStr ? finalStr.charAt(0).toUpperCase() + finalStr.slice(1) : "";
    }


    // Helper function to format numbers with commas and suffixes
    formatNumber(num) {
        if (num === undefined || num === null) return '0';
        if (num === 0 && typeof num === 'number') return '0'; // Ensure 0 is returned as '0'

        const tiers = [
            { N: 1e27, S: 'Oc' }, { N: 1e24, S: 'Sp' }, { N: 1e21, S: 'Sx' },
            { N: 1e18, S: 'Qi' }, { N: 1e15, S: 'Qa' }, { N: 1e12, S: 'T' },
            { N: 1e9, S: 'B' },   { N: 1e6, S: 'M' }
        ];

        for (let i = 0; i < tiers.length; i++) {
            if (num >= tiers[i].N) {
                // Use toFixed(0) if it's a whole number after division, otherwise toFixed(1)
                const val = num / tiers[i].N;
                return (val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)) + ' ' + tiers[i].S;
            }
        }
        return num.toLocaleString(); // For numbers less than 1 Million or unhandled
    }

    // Initialize all DOM elements needed for the game
    initializeElements() {
        this.elements = {
            clickArea: document.getElementById('clickArea'),        // Main clickable image
            counter: document.getElementById('counter'),            // Click count display
            counterWords: document.getElementById('counter-words'), // For text representation of counter
            playerNameModal: document.getElementById('player-name-modal'),  // Name input modal
            playerNameInput: document.getElementById('player-name-input'),  // Name input field
            playerNameButton: document.querySelector('#player-name-modal .upgrade-btn'),
            overlay: document.getElementById('overlay'),            // Dark overlay for modals
            autoClickerBtn: document.getElementById('autoClickerBtn'),  // Auto clicker purchase button
            multiplierBtn: document.getElementById('multiplierBtn'),    // Multiplier purchase button
            leaderboardBtn: document.getElementById('leaderboard-btn'), // Show leaderboard button
            resetBtn: document.getElementById('reset-btn'),         // Reset game button
            autoClickersDisplay: document.getElementById('auto-clickers'), // Shows owned auto clickers
            multiplierDisplay: document.getElementById('multiplier'),     // Shows current multiplier
            skinsBtn: document.getElementById('skins-btn'),        // Open skins modal button
            skinsModal: document.getElementById('skins-modal'),    // Skins selection modal
            skinsClose: document.getElementById('skins-close'),    // Close skins modal button
            skinOptions: document.querySelectorAll('.skin-option'), // All available skins (from both modals)
            // Sigma Skins Elements
            sigmaSkinsBtn: document.getElementById('sigma-skins-btn'),
            sigmaSkinsModal: document.getElementById('sigma-skins-modal'),
            sigmaSkinsClose: document.getElementById('sigma-skins-close')
        };
    }

    // Initialize audio system with a pool of sound effects for better performance
    initializeAudio() {
        // Use smaller pool for Safari due to audio limitations
        const AUDIO_POOL_SIZE = this.isSafari ? 2 : 3;

        // Create pool of audio objects for click sounds
        this.audioPool = Array.from({ length: AUDIO_POOL_SIZE }, () => {
            const audio = new Audio('pop-sound.mp3');
            // Lower volume on Safari
            audio.volume = this.isSafari ? 0.05 : 0.1;
            audio.preload = 'auto';

            // Safari-specific optimizations
            if (this.isSafari) {
                audio.load();
                audio.playbackRate = 1.5;
            }
            return audio;
        });
    }

    // Load and prepare skin images for the current skin
    async initializeImages() {
        // Create image objects for normal and clicked states
        this.images = {
            normal: new Image(),
            click: new Image()
        };

        // Get image paths for current skin
        const currentSkinImages = this.skinImages[this.state.currentSkin];

        // Load both images simultaneously
        await Promise.all([
            new Promise(resolve => {
                this.images.normal.onload = resolve;
                this.images.normal.src = currentSkinImages.normal;
            }),
            new Promise(resolve => {
                this.images.click.onload = resolve;
                this.images.click.src = currentSkinImages.click;
            })
        ]);

        // Set initial image
        this.elements.clickArea.src = this.images.normal.src;
    }

    // Set up all event listeners for user interactions
    setupEventListeners() {
        // Mouse click events
        this.elements.clickArea.addEventListener('mousedown', () => this.handleClickStart());
        this.elements.clickArea.addEventListener('mouseup', () => this.handleClickEnd());
        this.elements.clickArea.addEventListener('mouseleave', () => this.handleClickEnd());

        // Touch events for mobile devices
        this.elements.clickArea.addEventListener('touchstart', (e) => {
            e.preventDefault();  // Prevent default touch behavior
            this.handleClickStart();
        });
        this.elements.clickArea.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleClickEnd();
        });

        // Keyboard events for accessibility
        document.addEventListener('keydown', (e) => {
            // Prioritize Sigma code input
            this.handleKeyboardInput(e);

            // Existing click simulation, ensure it doesn't interfere if sigma code is being typed
            // or if a modal/input is active.
            if (this.elements.playerNameModal.style.display === 'block' || e.repeat) return;
            if (document.activeElement.tagName !== 'INPUT') { // Don't simulate click if typing in an input
                this.handleClickStart();
            }
        });

        document.addEventListener('keyup', (e) => {
            // Ensure keyup doesn't interfere if sigma code was being typed or in an input
            if (this.elements.playerNameModal.style.display === 'block' || document.activeElement.tagName === 'INPUT') return;
            this.handleClickEnd();
        });

        // Button click handlers
        this.elements.autoClickerBtn.addEventListener('click', () => this.buyAutoClicker());
        this.elements.multiplierBtn.addEventListener('click', () => this.buyMultiplier());
        this.elements.resetBtn.addEventListener('click', () => this.resetGame());

        // Player name input handlers
        this.elements.playerNameButton.addEventListener('click', () => this.setPlayerName());
        this.elements.playerNameInput.addEventListener('input', () => {
            const playerName = this.elements.playerNameInput.value.trim();
            this.elements.playerNameButton.disabled = playerName.length === 0;
        });

        // Skin system handlers
        this.elements.skinsBtn.addEventListener('click', () => {
            this.elements.skinsModal.style.display = 'block';
            this.elements.overlay.style.display = 'block';
            this.updateSelectedSkin();
        });

        this.elements.skinsClose.addEventListener('click', () => {
            this.closeSpecificModal(this.elements.skinsModal);
        });

        // Sigma Skins button and modal listeners
        if (this.elements.sigmaSkinsBtn) {
            this.elements.sigmaSkinsBtn.addEventListener('click', () => this.openSigmaSkinsModal());
        }
        if (this.elements.sigmaSkinsClose) {
            this.elements.sigmaSkinsClose.addEventListener('click', () => this.closeSpecificModal(this.elements.sigmaSkinsModal));
        }

        // Set up skin selection buttons
        // This listener setup will apply to all elements with .skin-option and .skin-select-btn
        // found at initialization time. If new skin options are added dynamically to the DOM
        // after this, event delegation on the parent container would be more robust.
        // For now, this should work if HTML for both modals is present on page load.
        this.elements.skinOptions.forEach(option => {
            const selectBtn = option.querySelector('.skin-select-btn');
            if (selectBtn) { // Ensure the button exists
                selectBtn.addEventListener('click', () => {
                    const skin = option.dataset.skin;
                    this.changeSkin(skin);
                });
            }
        });

        // General overlay click to close any open modal
        this.elements.overlay.addEventListener('click', (e) => {
            if (e.target === this.elements.overlay) { // Ensure click is on overlay itself
                this.closeAllModals();
            }
        });
    }
    playClickSound() {
        if (this.isSafari) {
            this.audioPool[this.currentAudio].play().catch(() => {});
        } else {
            this.audioPool[this.currentAudio].currentTime = 0;
            this.audioPool[this.currentAudio].play().catch(() => {});
        }
        this.currentAudio = (this.currentAudio + 1) % this.audioPool.length;
    }

    handleClickStart() {
        this.playClickSound();
        this.state.clicks += this.state.multiplier;
        this.updateCounter();
        this.elements.clickArea.src = this.images.click.src;
    }

    handleClickEnd() {
        this.elements.clickArea.src = this.images.normal.src;
    }

    updateButtonStates() {
        // Auto Clicker button
        this.elements.autoClickerBtn.innerHTML =
            `Buy Auto Clicker (Cost: ${this.formatNumber(Math.floor(this.state.autoClickerCost))} clicks)
            <div class="button-stat">Auto Clickers: ${this.state.autoClickers}</div>`;

        // Multiplier button
        this.elements.multiplierBtn.innerHTML =
            `Buy Multiplier (Cost: ${this.formatNumber(Math.floor(this.state.multiplierCost))} clicks)
            <div class="button-stat">Current: ${this.state.multiplier.toFixed(1)}x</div>`;

        this.elements.autoClickerBtn.disabled = this.state.clicks < this.state.autoClickerCost;
        this.elements.multiplierBtn.disabled = this.state.clicks < this.state.multiplierCost;

        const currentClicks = Math.floor(this.state.clicks);
        this.elements.counter.textContent = currentClicks.toLocaleString();
        if (this.elements.counterWords) {
            this.elements.counterWords.textContent = this.numberToWords(currentClicks);
        }
        this.elements.autoClickersDisplay.textContent = this.state.autoClickers;
        this.elements.multiplierDisplay.textContent = this.state.multiplier.toFixed(1);
    }

    updateCounter() {
        this.pendingClicks++;

        const now = Date.now();
        if (now - this.lastUpdateTime > 16) {
            this.updateButtonStates();
            this.updateSelectedSkin();

            // Save game state every SAVE_INTERVAL milliseconds
            if (now - this.lastSaveTime >= this.SAVE_INTERVAL) {
                this.state.save();
                this.lastSaveTime = now;
            }

            this.lastUpdateTime = now;
            this.pendingClicks = 0;
        }
    }

    buyAutoClicker() {
        if (this.state.clicks >= this.state.autoClickerCost) {
            this.state.clicks -= this.state.autoClickerCost;
            this.state.autoClickers++;
            const newCost = Math.floor(this.state.autoClickerCost * 1.5);
            Logger.log(Logger.LEVELS.INFO, 'Auto clicker purchased', {
                totalAutoClickers: this.state.autoClickers,
                cost: this.state.autoClickerCost,
                newCost
            });
            this.state.autoClickerCost = newCost;
            this.state.save();
            this.updateCounter();
        }
    }

    buyMultiplier() {
        if (this.state.clicks >= this.state.multiplierCost) {
            this.state.clicks -= this.state.multiplierCost;
            this.state.multiplier *= 2;
            this.state.multiplierCost *= 3;
            this.updateCounter();
        }
    }

    resetGame() {
        // Add confirmation dialog
        if (confirm('Are you sure you want to reset the game? All progress will be lost!')) {
            Logger.log(Logger.LEVELS.INFO, 'Game reset', {
                playerName: this.state.playerName,
                finalScore: this.state.clicks,
                autoClickers: this.state.autoClickers,
                multiplier: this.state.multiplier
            });
            localStorage.clear();
            location.reload();
        }
    }

    setPlayerName() {
        const playerName = this.elements.playerNameInput.value.trim();
        if (playerName) {
            this.state.playerName = playerName;
            this.state.save();
            Logger.log(Logger.LEVELS.INFO, 'New player started game', { playerName });
            this.elements.playerNameModal.style.display = 'none';
            this.elements.overlay.style.display = 'none';
            this.start();
        }
    }

    start() {
        // Ensure all modals are closed at the very start of game logic execution
        this.closeAllModals();
        Logger.log(Logger.LEVELS.DEBUG, "Called closeAllModals() at the beginning of game.start()");
        Logger.log(Logger.LEVELS.DEBUG, `SkinsModal display after closeAllModals in start: ${this.elements.skinsModal ? this.elements.skinsModal.style.display : 'null'}`);
        Logger.log(Logger.LEVELS.DEBUG, `SigmaSkinsModal display after closeAllModals in start: ${this.elements.sigmaSkinsModal ? this.elements.sigmaSkinsModal.style.display : 'null'}`);
        Logger.log(Logger.LEVELS.DEBUG, `Overlay display after closeAllModals in start: ${this.elements.overlay ? this.elements.overlay.style.display : 'null'}`);

        if (!this.state.playerName) {
            if (this.elements.playerNameModal) this.elements.playerNameModal.style.display = 'block';
            if (this.elements.overlay) this.elements.overlay.style.display = 'block'; // Show overlay only if a modal is shown
            if (this.elements.playerNameButton) this.elements.playerNameButton.disabled = true;
            Logger.log(Logger.LEVELS.INFO, "Player name modal shown because no player name was found.");
        } else {
            this.updateButtonStates();
            this.startAutoClickers();
            Logger.log(Logger.LEVELS.INFO, "Game started for existing player.");
        }
    }

    startAutoClickers() {
        setInterval(() => {
            if (this.state.autoClickers > 0) {
                this.state.clicks += this.state.autoClickers * this.state.multiplier;
                this.updateCounter();
            }
        }, 1000);
    }

    setupLeaderboard() {
        // Leaderboard button click handler
        this.elements.leaderboardBtn.addEventListener('click', async () => {
            await this.updateLeaderboard(true);
            document.getElementById('leaderboard-modal').classList.add('visible');
            this.elements.overlay.style.display = 'block';
        });

        // Close button handler
        document.getElementById('leaderboard-close').addEventListener('click', () => {
            this.closeSpecificModal(document.getElementById('leaderboard-modal'));
        });

        // Auto-update leaderboard every 30 seconds if there are changes
        setInterval(async () => {
            if (this.state.playerName && this.state.clicks > 0) {
                await this.updateLeaderboard(false);
            }
        }, 30000);
    }

    // Helper to close all modals
    closeAllModals() {
        const leaderboardModal = document.getElementById('leaderboard-modal');
        if (leaderboardModal) {
            leaderboardModal.classList.remove('visible');
        }

        // Ensure this.elements is defined before trying to access its properties
        if (this.elements) {
            if (this.elements.skinsModal) {
                this.elements.skinsModal.style.display = 'none';
            }
            if (this.elements.sigmaSkinsModal) {
                this.elements.sigmaSkinsModal.style.display = 'none';
            }
            if (this.elements.playerNameModal) {
                this.elements.playerNameModal.style.display = 'none';
            }
            if (this.elements.overlay) {
                this.elements.overlay.style.display = 'none';
            }
        } else {
            // This case should ideally not happen if initializeElements is called correctly
            // but it's a safeguard.
            const skinsModalById = document.getElementById('skins-modal');
            if (skinsModalById) skinsModalById.style.display = 'none';
            const sigmaSkinsModalById = document.getElementById('sigma-skins-modal');
            if (sigmaSkinsModalById) sigmaSkinsModalById.style.display = 'none';
            // ... and so on for other modals if this.elements is not yet available.
        }
    }

    // Helper to close a specific modal and check overlay
    closeSpecificModal(modalElement) {
        if (!modalElement) return;
        if (modalElement.id === 'leaderboard-modal') { // Leaderboard uses class for visibility
            modalElement.classList.remove('visible');
        } else {
            modalElement.style.display = 'none';
        }
        this.checkAndHideOverlay();
    }

    closeLeaderboard() {
        document.getElementById('leaderboard-modal').classList.remove('visible');
        this.elements.overlay.style.display = 'none';
    }

    async updateLeaderboard(showModal = true) {
        try {
            if (!this.state.playerName) {
                Logger.log(Logger.LEVELS.WARN, 'Attempted to update leaderboard without player name');
                return;
            }

            const currentScore = Math.floor(this.state.clicks);

            const response = await fetch('leaderboard.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: this.state.playerName,
                    score: currentScore
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const leaderboardData = await response.json();

            // Update leaderboard display
            const tbody = document.querySelector('#leaderboard-table tbody');
            tbody.innerHTML = '';

            leaderboardData.forEach((entry, index) => {
                const row = tbody.insertRow();
                row.insertCell(0).textContent = index + 1;
                row.insertCell(1).textContent = entry.username;
                row.insertCell(2).textContent = this.formatNumber(Math.floor(entry.score));

                if (entry.username === this.state.playerName) {
                    row.style.backgroundColor = 'rgba(255, 255, 0, 0.2)';
                }
            });

        } catch (error) {
            Logger.log(Logger.LEVELS.ERROR, 'Leaderboard update failed', {
                error: error.message,
                playerName: this.state.playerName
            });
        }
    }

    checkAndHideOverlay() {
        const isLeaderboardOpen = document.getElementById('leaderboard-modal')?.classList.contains('visible');
        const areOtherModalsOpen = (this.elements.skinsModal?.style.display === 'block') ||
                                   (this.elements.sigmaSkinsModal?.style.display === 'block') ||
                                   (this.elements.playerNameModal?.style.display === 'block');

        if (!isLeaderboardOpen && !areOtherModalsOpen && this.elements.overlay) {
            this.elements.overlay.style.display = 'none';
        }
    }

    updateSelectedSkin() {
        this.elements.skinOptions.forEach(option => {
            const skin = option.dataset.skin;
            const skinData = this.skinImages[skin];
            const isUnlocked = this.state.unlockedSkins.includes(skin);
            const selectBtn = option.querySelector('.skin-select-btn');
            const costDisplay = option.querySelector('.skin-cost');

            if (!skinData) {
                 Logger.log(Logger.LEVELS.ERROR, `Skin data for ${skin} not found in skinImages object.`);
                 // Hide or disable the option if data is missing
                 option.style.display = 'none';
                 return;
            }

            if (isUnlocked) {
                // If Henri skin is being checked and Sigma mode is not unlocked,
                // we might want to visually treat it as locked, even if 'unlockedSkins' has it.
                // However, if it's in unlockedSkins, it *is* unlocked. The display logic here
                // correctly reflects the unlocked state. The Sigma button controls access to the modal.
                selectBtn.textContent = skin === this.state.currentSkin ? 'Selected' : 'Select';
                selectBtn.disabled = skin === this.state.currentSkin;
                if (costDisplay) costDisplay.style.display = 'none';
            } else {
                if (skinData.isReward) {
                    selectBtn.textContent = 'Claim Reward';
                    if (costDisplay) {
                        costDisplay.textContent = `Reward: +${this.formatNumber(Math.abs(skinData.cost))} clicks`;
                        costDisplay.style.display = 'block';
                    }
                } else {
                    selectBtn.textContent = `Buy (${this.formatNumber(skinData.cost)} clicks)`;
                    if (costDisplay) {
                        costDisplay.textContent = `Cost: ${this.formatNumber(skinData.cost)} clicks`;
                        costDisplay.style.display = 'block';
                    }
                    selectBtn.disabled = this.state.clicks < skinData.cost;
                }
            }

            if (skin === this.state.currentSkin) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
    }

    async changeSkin(skin) {
        const skinData = this.skinImages[skin];
        if (!skinData) {
             Logger.log(Logger.LEVELS.ERROR, `Attempted to change to skin "${skin}" but data not found.`);
             return;
        }

        const isUnlocked = this.state.unlockedSkins.includes(skin);

        if (!isUnlocked) {
            if (skinData.isReward) {
                // For reward skins, add clicks instead of subtracting
                this.state.clicks += Math.abs(skinData.cost);
                this.state.unlockedSkins.push(skin);
                Logger.log(Logger.LEVELS.INFO, 'Reward skin claimed', {
                    skin,
                    reward: Math.abs(skinData.cost)
                });
                this.state.save();
                this.updateCounter();
            } else if (this.state.clicks >= skinData.cost) {
                this.state.clicks -= skinData.cost;
                this.state.unlockedSkins.push(skin);
                Logger.log(Logger.LEVELS.INFO, 'New skin unlocked', {
                    skin,
                    cost: skinData.cost
                });
                this.state.save();
                this.updateCounter();
            } else {
                // Not enough clicks, do nothing
                return;
            }
        }

        // If the skin is now unlocked (either was already or just purchased/claimed)
        if (this.state.unlockedSkins.includes(skin) && skin !== this.state.currentSkin) {
            this.state.currentSkin = skin;
            this.state.save();

            // Play Ronaldo sound if CR7 skin is selected
            if (skin === 'cr7') {
                try {
                    await this.ronaldoSound.play();
                } catch (error) {
                    Logger.log(Logger.LEVELS.ERROR, 'Failed to play CR7 sound', { error: error.message });
                }
            }

            const skinImages = this.skinImages[skin];

            await Promise.all([
                new Promise(resolve => {
                    this.images.normal.onload = resolve;
                    this.images.normal.src = skinImages.normal;
                }),
                new Promise(resolve => {
                    this.images.click.onload = resolve;
                    this.images.click.src = skinImages.click;
                })
            ]);

            this.elements.clickArea.src = this.images.normal.src;
        }
        this.updateSelectedSkin(); // Update button states for all skins
    }

    // --- Sigma Mode Methods ---
    handleKeyboardInput(event) {
        // Don't process if an input field is focused, or if a modal that takes input is open,
        // or if it's not a single character key (e.g. Shift, Ctrl, etc.)
        if (document.activeElement.tagName === 'INPUT' ||
            (this.elements.playerNameModal && this.elements.playerNameModal.style.display === 'block') ||
            event.key.length > 1 || event.metaKey || event.ctrlKey || event.altKey) {
            // Reset typedCode if a non-character or modifier key (except Shift) is pressed,
            // to prevent partial matches if the user navigates away or uses shortcuts.
            if (event.key !== 'Shift') {
                 this.typedCode = '';
            }
            return;
        }

        const key = event.key.toLowerCase();
        this.typedCode += key;

        // Keep the typed sequence the same length as the sigma code
        if (this.typedCode.length > this.sigmaCode.length) {
            this.typedCode = this.typedCode.slice(-this.sigmaCode.length);
        }

        // Check if the typed sequence matches the sigma code
        if (this.typedCode === this.sigmaCode) {
            if (!this.state.isSigmaModeUnlocked) {
                this.state.isSigmaModeUnlocked = true;
                this.state.save(); // Save the unlocked state
                if (this.elements.sigmaSkinsBtn) {
                    this.elements.sigmaSkinsBtn.style.display = 'block'; // Show the sigma skins button
                }
                Logger.log(Logger.LEVELS.INFO, "Sigma Mode Unlocked!");
                // You could add a visual notification here (e.g., a temporary message on screen)
            }
            this.typedCode = ''; // Reset typed code after successful match
        }
    }

    openSigmaSkinsModal() {
        this.closeAllModals(); // Close any other open modals first
        if (this.elements.sigmaSkinsModal) this.elements.sigmaSkinsModal.style.display = 'block';
        if (this.elements.overlay) this.elements.overlay.style.display = 'block';
        this.updateSelectedSkin(); // Update button states for skins in this modal
    }
    // closeSigmaSkinsModal is now handled by closeSpecificModal via its event listener
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize game
    const game = new Game(); // The constructor now calls closeAllModals() after initializeElements()

    // Start the game logic. game.start() also calls closeAllModals() at its beginning.
    game.start();
    Logger.log(Logger.LEVELS.INFO, "Game initialized and started after DOMContentLoaded.");
});