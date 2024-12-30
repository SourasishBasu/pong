const config = {
    type: Phaser.AUTO, // Use WebGL if available, otherwise Canvas
    width: 800, // Canvas width
    height: 600, // Canvas height
    physics: {
        default: 'arcade', // Use the Arcade Physics engine
        arcade: {
            gravity: { y: 0 }, // No gravity for Pong
            debug: false // Set to true to see physics boundaries

        }
    },
    scene: {
        preload: preload, // Load assets
        create: create, // Set up game objects
        update: update, // Game loop
        scoreGoal: scoreGoal,    
        gameOver: gameOver  
    }
};

const game = new Phaser.Game(config);

function preload() {
    this.load.image('background','assets/images/background.jpg') //background
    this.load.spritesheet('ball','assets/images/ball.png',{ //ball
        frameWidth: 32,
        frameHeight : 32,
        endframe:4
    })

    this.load.image('paddle','assets/images/greenpaddle.png')

    this.load.audio('hit',"assets/sounds/bounce.mp3")
}

function create() {

    //adding background
    
    const background = this.add.image(400, 300, 'background');
    background.setDisplaySize(800, 600);

    //adding inputs
    this.cursors = this.input.keyboard.createCursorKeys(); 

    // adding ball
    this.ball = this.physics.add.sprite(400,300,'ball');
    this.ball.setCollideWorldBounds(true); // Make the ball bounce off the edges
    this.ball.setBounce(1, 1); // Perfectly elastic collision
    this.ball.setVelocity(200, 200); // Set initial velocity
    this.ball.setDisplaySize(50, 50);

    this.anims.create({
        key: 'spin', // Name of the animation
        frames: this.anims.generateFrameNumbers('ball', { start: 0, end: 3 }), // Frames to use
        frameRate: 6, // Speed of the animation
        repeat: -1 // Loop indefinitely
    });

    this.ball.play('spin');

    //adding paddles
    this.leftPaddle = this.physics.add.sprite(50, 300, 'paddle');
    this.leftPaddle.setImmovable(true); 
    this.leftPaddle.setCollideWorldBounds(true); 

    this.rightPaddle = this.physics.add.sprite(750, 300, 'paddle');
    this.rightPaddle.setImmovable(true);
    this.rightPaddle.setCollideWorldBounds(true);

    this.leftPaddle.setDisplaySize(40, 150); // Adjust the size as needed
    this.rightPaddle.setDisplaySize(40, 150);


    //adding hit sound
    this.hitSound = this.sound.add('hit');

    this.physics.add.collider(this.ball, this.leftPaddle, () => {
        this.hitSound.play();
    });
    this.physics.add.collider(this.ball, this.rightPaddle, () => {
        this.hitSound.play();
    });
    

    //adding boundary for scoring
    this.leftBoundary = this.add.rectangle(0, 300, 1, 600);
    this.physics.add.existing(this.leftBoundary, true);

    this.rightBoundary = this.add.rectangle(800, 300, 1, 600);
    this.physics.add.existing(this.rightBoundary, true);

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

function update() {
    this.ball.rotation += 0.05;

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

function scoreGoal(player){
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

function gameOver(winner) {
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
