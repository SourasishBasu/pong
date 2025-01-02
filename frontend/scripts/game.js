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
        this.ball.setVelocity(200, 200);
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
                this.setupOnlineMultiplayer();
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
                this.rightPaddle.setVelocityY(200);
            } else if (this.ball.y < this.rightPaddle.y) {
                this.rightPaddle.setVelocityY(-200);
            } else {
                this.rightPaddle.setVelocityY(0);
            }
        } else if (this.mode === 'local') {
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
    }

    setupSinglePlayer() {
        this.cursors = this.input.keyboard.createCursorKeys();
    }
    
    setupLocalMultiplayer() {
        this.leftCursors = this.input.keyboard.addKeys('W,S');
        this.rightCursors = this.input.keyboard.addKeys('UP,DOWN');
    }
    
    setupOnlineMultiplayer() {
        this.add.text(400, 300, 'Online Multiplayer Not Implemented Yet', {
            fontSize: '32px',
            fill: '#FFF'
        }).setOrigin(0.5, 0.5);
    }



    scoreGoal(player) {
        if (player === 'left') {
            this.scoreLeft++;
        } else if (player === 'right') {
            this.scoreRight++;
        }

        this.scoreText.setText(`${this.scoreLeft} : ${this.scoreRight}`);

        // Check for game over
        if (this.scoreLeft >= 10 || this.scoreRight >= 10) {
            this.gameOver(player);
            return;
        }

        this.ball.setPosition(400, 300);
        this.ball.setVelocity(200 * (player === 'left' ? 1 : -1), Phaser.Math.Between(-200, 200));
    }


    gameOver(winner) {
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