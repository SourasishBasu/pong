class PongScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PongScene' });
    }

    init() {
        var urlParams = new URLSearchParams(window.location.search);
        this.mode = urlParams.get('mode');
    }

    preload() {
        this.load.image('background', 'assets/images/background.jpg');
        this.load.spritesheet('ball', 'assets/images/ball.png', {
            frameWidth: 32,
            frameHeight: 32,
            endframe: 4
        });
        this.load.image('paddle', 'assets/images/greenpaddle.png');
        this.load.audio('hit', "assets/sounds/bounce.mp3");
    }

    create() {

        // Adding background
        const background = this.add.image(400, 300, 'background');
        background.setDisplaySize(800, 600);

        // Adding ball
        this.ball = this.physics.add.sprite(400, 300, 'ball');
        this.ball.setCollideWorldBounds(true);
        this.ball.setBounce(1, 1);
        this.ball.setVelocity(300, 300);
        this.ball.setDisplaySize(50, 50);

        // Create ball animation
        this.anims.create({
            key: 'spin',
            frames: this.anims.generateFrameNumbers('ball', { start: 0, end: 3 }),
            frameRate: 6,
            repeat: -1
        });
        this.ball.play('spin');

        // Adding paddles
        this.leftPaddle = this.physics.add.sprite(50, 300, 'paddle');
        this.leftPaddle.setImmovable(true);
        this.leftPaddle.setCollideWorldBounds(true);

        this.rightPaddle = this.physics.add.sprite(750, 300, 'paddle');
        this.rightPaddle.setImmovable(true);
        this.rightPaddle.setCollideWorldBounds(true);
        this.aiTargetY = this.rightPaddle.y;

        this.leftPaddle.setDisplaySize(40, 150);
        this.rightPaddle.setDisplaySize(40, 150);

        // Adding hit sound
        this.hitSound = this.sound.add('hit');

        // Adding paddle colliders with sound
        this.physics.add.collider(this.ball, this.leftPaddle, () => {
            this.hitSound.play();
        });
        this.physics.add.collider(this.ball, this.rightPaddle, () => {
            this.hitSound.play();
        });

        // Adding boundary for scoring
        this.leftBoundary = this.add.rectangle(0, 300, 1, 600);
        this.physics.add.existing(this.leftBoundary, true);

        this.rightBoundary = this.add.rectangle(800, 300, 1, 600);
        this.physics.add.existing(this.rightBoundary, true);

        // Adding boundary colliders
        this.physics.add.collider(this.ball, this.leftBoundary, () => this.scoreGoal('right'), null, this);
        this.physics.add.collider(this.ball, this.rightBoundary, () => this.scoreGoal('left'), null, this);

        // Initialize scores
        this.scoreLeft = 0;
        this.scoreRight = 0;

        // Display scores
        this.scoreText = this.add.text(400, 50, '0 : 0', {
            fontSize: '32px',
            fill: '#FFFFFF',
            fontFamily: 'Arial'
        }).setOrigin(0.5, 0.5);

        // Set up controls based on mode
        switch (this.mode) {
            case 'ai':
                this.setupSinglePlayer();
                break;
            case 'local':
                this.setupLocalMultiplayer();
                break;
            case 'multiplayer':
                this.socket = io();
                this.ball.setVelocity(0, 0);
                this.showMultiplayerMenu();
                break;
            default:
                this.setupSinglePlayer();
                break;
        }
    }

    update() {
        this.ball.rotation += 0.05;

        if (this.mode === 'ai') {
            // Left paddle controls
            if (this.cursors.up.isDown) {
                this.leftPaddle.setVelocityY(-300);
            } else if (this.cursors.down.isDown) {
                this.leftPaddle.setVelocityY(300);
            } else {
                this.leftPaddle.setVelocityY(0);
            }

            // AI for right paddle
            if (this.ball.y > this.rightPaddle.y) {
                this.rightPaddle.setVelocityY(200*(this.ball.x > 200?1:0.5));
            } else if (this.ball.y < this.rightPaddle.y) {
                this.rightPaddle.setVelocityY(-200);
            } else {
                this.rightPaddle.setVelocityY(0);
            }
        } 
        
        else if (this.mode === 'local') {
            // Left paddle (W/S keys)
            if (this.leftCursors.W.isDown) {
                this.leftPaddle.setVelocityY(-300);
            } else if (this.leftCursors.S.isDown) {
                this.leftPaddle.setVelocityY(300);
            } else {
                this.leftPaddle.setVelocityY(0);
            }

            // Right paddle (UP/DOWN keys)
            if (this.rightCursors.UP.isDown) {
                this.rightPaddle.setVelocityY(-300);
            } else if (this.rightCursors.DOWN.isDown) {
                this.rightPaddle.setVelocityY(300);
            } else {
                this.rightPaddle.setVelocityY(0);
            }
        }

        else if (this.mode === 'multiplayer'){
            // Local input for left paddle (W/S keys)
            if (this.role === 'left') {
                // Local input for left paddle (W/S keys)
                if (this.leftCursors.up.isDown) {
                    this.leftPaddle.setVelocityY(-300);
                } else if (this.leftCursors.down.isDown) {
                    this.leftPaddle.setVelocityY(300);
                } else {
                    this.leftPaddle.setVelocityY(0);
                }
    
                // Emit left paddle movement
                if (this.leftPaddle.oldY !== this.leftPaddle.y) {
                    this.socket.emit('paddleMove', { y: this.leftPaddle.y, player: 'left' });
                    this.leftPaddle.oldY = this.leftPaddle.y;
                }
            } else if (this.role === 'right') {
                if (this.rightCursors.up.isDown) {
                    this.rightPaddle.setVelocityY(-300);
                } else if (this.rightCursors.down.isDown) {
                    this.rightPaddle.setVelocityY(300);
                } else {
                    this.rightPaddle.setVelocityY(0);
                }
    
                // Emit right paddle movement
                if (this.rightPaddle.oldY !== this.rightPaddle.y) {
                    this.socket.emit('paddleMove', { y: this.rightPaddle.y, player: 'right' });
                    this.rightPaddle.oldY = this.rightPaddle.y;
                }
            }
            if (this.role === 'left') {
                if (this.ball.oldX !== this.ball.x || this.ball.oldY !== this.ball.y) {
                    this.socket.emit('ballUpdate', {
                        x: this.ball.x,
                        y: this.ball.y,
                        velocityX: this.ball.body.velocity.x,
                        velocityY: this.ball.body.velocity.y
                    });
                    this.ball.oldX = this.ball.x;
                    this.ball.oldY = this.ball.y;
                }
            }
        }
    }

    setupSinglePlayer() {
        this.cursors = this.input.keyboard.createCursorKeys();
    }
    
    setupLocalMultiplayer() {
        this.leftCursors = this.input.keyboard.addKeys('W,S');
        this.rightCursors = this.input.keyboard.addKeys('UP,DOWN');
    }
    
    showMultiplayerMenu() {
        
        // Create Room Button
        const createRoomButton = this.add.text(400, 250, 'Create Room', {
            fontSize: '32px',
            fill: '#FFFFFF',
            fontFamily: 'Arial'
        }).setOrigin(0.5, 0.5).setInteractive();
    
        createRoomButton.on('pointerdown', () => {
            this.socket.emit('createRoom');
            this.role = 'left'; // Room creator is the left paddle
            this.setupMultiplayerInput();
        });
    
        // Join Room Button
        const joinRoomButton = this.add.text(400, 350, 'Join Room', {
            fontSize: '32px',
            fill: '#FFFFFF',
            fontFamily: 'Arial'
        }).setOrigin(0.5, 0.5).setInteractive();
    
        joinRoomButton.on('pointerdown', () => {
            const roomCode = prompt('Enter Room Code:'); // Simple prompt for now
            if (roomCode) {
                this.socket.emit('joinRoom', roomCode);
                this.role = 'right'; // Joiner is the right paddle
                this.setupMultiplayerInput();
            }
        });
    
        this.socket.on('roomCreated', (roomCode) => {
            this.clearUI()
            this.add.text(400, 250, `Room Code: ${roomCode}`, {
                fontSize: '24px',
                fill: '#FFFFFF'
            }).setOrigin(0.5, 0.5);
            this.add.text(400, 350, `Waiting for player...`, {
                fontSize: '24px',
                fill: '#FFFFFF'
            }).setOrigin(0.5, 0.5);
        });
    
        this.socket.on('roomJoined', () => {
            this.startGame(); // Start the game
        });
    
        this.socket.on('paddleUpdate', (data) => {
            if (data.player === 'left') {
                this.leftPaddle.y = data.y; // Update left paddle position
            } else if (data.player === 'right') {
                this.rightPaddle.y = data.y; // Update right paddle position
            }
        });

        this.socket.on('ballUpdate', (data) => {
            if (this.role === 'right') {  // Only update ball position for the client
                this.ball.setPosition(data.x, data.y);
                this.ball.setVelocity(data.velocityX, data.velocityY);
            }
        });

        this.socket.on('scoreGoal', (data) => {
            console.log('Received scoreGoal event:', data);
            this.scoreLeft = data.leftScore;
            this.scoreRight = data.rightScore;
            this.scoreText.setText(`${this.scoreLeft} : ${this.scoreRight}`);
            
            if (this.scoreLeft >= 5 || this.scoreRight >= 5) {
                this.gameOver(data.scorer);
            }
        });
    
        this.socket.on('gameOver', (winner) => {
            // Stop the ball
            this.ball.setVelocity(0, 0);

            // Stop physics updates
            this.physics.pause();
    
            // Display game over message
            this.add.text(400, 300, `Game Over! ${winner === 'left' ? 'Left' : 'Right'} Player Wins!`, {
                fontSize: '48px',
                fill: '#FFFFFF',
                fontFamily: 'Arial'
            }).setOrigin(0.5, 0.5);
        });
    
        this.socket.on('joinError', (message) => {
            alert(message); // Show error message
        });
    
        this.socket.on('playerDisconnected', () => {
            this.physics.pause();
            alert('Opponent disconnected.'); // Handle disconnection
        });

    }

    setupMultiplayerInput() {
        if (this.role === 'left') {
            this.leftCursors = this.input.keyboard.createCursorKeys(); // Left player controls
        } else if (this.role === 'right') {
            this.rightCursors = this.input.keyboard.createCursorKeys(); // Right player controls
        }
    }
    

    scoreGoal(player) {
        // Only the host handles scoring logic
        if (this.mode === 'multiplayer') {
            if (this.role === 'left') {
                if (player === 'left') {
                    this.scoreLeft++;
                } else if (player === 'right') {
                    this.scoreRight++;
                }
                
                this.socket.emit('scoreGoal', player);
                
                if (this.scoreLeft >= 5 || this.scoreRight >= 5) {
                    this.gameOver(player);
                    return;
                }
                
                // Reset ball position and emit update
                this.ball.setPosition(400, 300);
                this.ball.setVelocity(300 * (player === 'left' ? 1 : -1), Phaser.Math.Between(-200, 200));
                this.socket.emit('ballUpdate', {
                    x: this.ball.x,
                    y: this.ball.y,
                    velocityX: this.ball.body.velocity.x,
                    velocityY: this.ball.body.velocity.y
                });
            }
        } else {
            // Non-multiplayer logic remains the same
            if (player === 'left') {
                this.scoreLeft++;
            } else if (player === 'right') {
                this.scoreRight++;
            }
            
            if (this.scoreLeft >= 5 || this.scoreRight >= 5) {
                this.gameOver(player);
                return;
            }
            
            this.ball.setPosition(400, 300);
            this.ball.setVelocity(300 * (player === 'left' ? 1 : -1), Phaser.Math.Between(-200, 200));
        }
        
        // Update score display for all cases
        this.scoreText.setText(`${this.scoreLeft} : ${this.scoreRight}`);
    }

    gameOver(winner) {
        // Stop the game physics
        this.physics.pause();
        this.ball.setVelocity(0, 0);

        // Display game over message
        const gameOverText = this.add.text(400, 300, `Game Over! ${winner === 'left' ? 'Left' : 'Right'} Player Wins!`, {
            fontSize: '48px',
            fill: '#FFFFFF',
            fontFamily: 'Arial'
        }).setOrigin(0.5, 0.5);

        // In multiplayer mode, emit game over event
        if (this.mode === 'multiplayer' && this.role === 'left') {
            this.socket.emit('gameOver', winner);
        }
    }

    startGame() {
        this.clearUI();
        this.ball.setVelocity(300, Phaser.Math.Between(-200, 200));
    }

    clearUI() {
        // Remove all text objects except the score text
        this.children.list
            .filter(child => child instanceof Phaser.GameObjects.Text && child !== this.scoreText)
            .forEach(child => child.destroy());
    }

    gameOver(winner) {
        // Stop physics updates
        this.physics.pause();

        // Display game over message
        this.add.text(400, 300, `Game Over! ${winner === 'left' ? 'Left' : 'Right'} Player Wins!`, {
            fontSize: '48px', 
            fill: '#FFFFFF',
            fontFamily: 'Arial'
        }).setOrigin(0.5, 0.5);
    }
}

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: PongScene
};

// Create the game instance
const game = new Phaser.Game(config);