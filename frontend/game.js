class PongScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PongScene' });
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

        // Adding inputs
        this.cursors = this.input.keyboard.createCursorKeys();

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
    }

    update() {
        this.ball.rotation += 0.05;

        // Left paddle controls
        if (this.cursors.up.isDown) {
            this.leftPaddle.setVelocityY(-300);
        } else if (this.cursors.down.isDown) {
            this.leftPaddle.setVelocityY(300);
        } else {
            this.leftPaddle.setVelocityY(0);
        }

    // Simple AI for the right paddle
    if (this.ball.y > this.rightPaddle.y) {
        this.rightPaddle.setVelocityY(200);
    } else if (this.ball.y < this.rightPaddle.y) {
        this.rightPaddle.setVelocityY(-200);
    } else {
        this.rightPaddle.setVelocityY(0);
    }
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