// Configuration du jeu
const config = {
    gravity: 0.4,
    jumpForce: -7,
    pipeSpeed: 2,
    pipeGap: 80,
    pipeFrequency: 1800, // ms
    birdSize: 12,
    groundHeight: 20
};

// Éléments du DOM
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const scoreDisplay = document.getElementById('score-display');
const finalScoreDisplay = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// Variables du jeu
let gameState = 'start'; // 'start', 'playing', 'gameover'
let score = 0;
let bird = {
    x: 50,
    y: 140,
    velocity: 0,
    rotation: 0
};
let pipes = [];
let lastPipeTime = 0;
let animationId;
let gameStarted = false;

// Initialisation du canvas
function initCanvas() {
    canvas.width = 280;
    canvas.height = 280;
    // Forcer le rendu pixelisé
    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
}

// Dessiner l'oiseau (pixelisé)
function drawBird() {
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rotation);
    
    // Corps de l'oiseau (carré pixelisé)
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-config.birdSize/2, -config.birdSize/2, config.birdSize, config.birdSize);
    
    // Ailes (animation basique)
    let wingOffset = Math.sin(Date.now() / 150) * 2;
    ctx.fillRect(-config.birdSize/2 + 2, -config.birdSize/2 + 2 + wingOffset, 8, 4);
    
    // Œil
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(config.birdSize/4 - 2, -config.birdSize/4, 3, 3);
    
    // Bec
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(config.birdSize/2 - 2, -1, 4, 2);
    
    ctx.restore();
}

// Dessiner un tuyau (pixelisé)
function drawPipe(pipe) {
    ctx.fillStyle = '#3a3a3a';
    
    // Tuyau du haut
    ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
    
    // Tuyau du bas
    ctx.fillRect(pipe.x, pipe.topHeight + config.pipeGap, pipe.width, canvas.height);
    
    // Bordures des tuyaux (pour effet pixel)
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(pipe.x - 2, pipe.topHeight - 8, pipe.width + 4, 8);
    ctx.fillRect(pipe.x - 2, pipe.topHeight + config.pipeGap, pipe.width + 4, 8);
    
    // Détails pixelisés sur les tuyaux
    ctx.fillStyle = '#5a5a5a';
    for (let i = 0; i < pipe.width; i += 4) {
        ctx.fillRect(pipe.x + i, pipe.topHeight - 12, 2, 4);
        ctx.fillRect(pipe.x + i, pipe.topHeight + config.pipeGap + 8, 2, 4);
    }
}

// Dessiner le sol (pixelisé)
function drawGround() {
    ctx.fillStyle = '#5a5a5a';
    ctx.fillRect(0, canvas.height - config.groundHeight, canvas.width, config.groundHeight);
    
    // Motif du sol (pixelisé)
    ctx.fillStyle = '#3a3a3a';
    for (let i = 0; i < canvas.width; i += 8) {
        ctx.fillRect(i, canvas.height - config.groundHeight, 4, 4);
    }
    
    // Bordure supérieure du sol
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, canvas.height - config.groundHeight, canvas.width, 2);
}

// Dessiner le ciel (arrière-plan pixelisé)
function drawSky() {
    ctx.fillStyle = '#8b8b8b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Nuages pixelisés occasionnels
    ctx.fillStyle = '#7a7a7a';
    for (let i = 0; i < 5; i++) {
        let x = (Date.now() / 50 + i * 70) % (canvas.width + 40) - 20;
        let y = 30 + i * 25;
        ctx.fillRect(x, y, 12, 6);
        ctx.fillRect(x + 4, y - 4, 8, 6);
    }
}

// Générer un nouveau tuyau
function generatePipe() {
    const minHeight = 30;
    const maxHeight = canvas.height - config.pipeGap - minHeight - config.groundHeight;
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight)) + minHeight;
    
    pipes.push({
        x: canvas.width,
        width: 30,
        topHeight: topHeight,
        passed: false
    });
}

// Mettre à jour les tuyaux
function updatePipes() {
    // Générer de nouveaux tuyaux
    const now = Date.now();
    if (now - lastPipeTime > config.pipeFrequency) {
        generatePipe();
        lastPipeTime = now;
    }
    
    // Déplacer et supprimer les tuyaux
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= config.pipeSpeed;
        
        // Vérifier si l'oiseau a passé le tuyau
        if (!pipes[i].passed && pipes[i].x + pipes[i].width < bird.x) {
            pipes[i].passed = true;
            score++;
            scoreDisplay.textContent = score;
        }
        
        // Supprimer les tuyaux hors écran
        if (pipes[i].x + pipes[i].width < 0) {
            pipes.splice(i, 1);
        }
    }
}

// Vérifier les collisions
function checkCollisions() {
    // Collision avec le sol
    if (bird.y + config.birdSize/2 > canvas.height - config.groundHeight) {
        return true;
    }
    
    // Collision avec le plafond
    if (bird.y - config.birdSize/2 < 0) {
        return true;
    }
    
    // Collision avec les tuyaux
    for (let pipe of pipes) {
        if (
            bird.x + config.birdSize/2 > pipe.x && 
            bird.x - config.birdSize/2 < pipe.x + pipe.width &&
            (bird.y - config.birdSize/2 < pipe.topHeight || 
             bird.y + config.birdSize/2 > pipe.topHeight + config.pipeGap)
        ) {
            return true;
        }
    }
    
    return false;
}

// Réinitialiser le jeu
function resetGame() {
    bird.y = 140;
    bird.velocity = 0;
    bird.rotation = 0;
    pipes = [];
    score = 0;
    scoreDisplay.textContent = score;
    lastPipeTime = Date.now();
    gameStarted = true;
}

// Boucle de jeu principale - CORRIGÉE
function gameLoop() {
    // Effacer le canvas
    drawSky();
    
    if (gameState === 'playing') {
        // Mettre à jour la physique de l'oiseau
        bird.velocity += config.gravity;
        bird.y += bird.velocity;
        
        // Rotation de l'oiseau en fonction de la vitesse
        bird.rotation = Math.max(-0.5, Math.min(0.5, bird.velocity * 0.05));
        
        // Mettre à jour les tuyaux
        updatePipes();
        
        // Vérifier les collisions
        if (checkCollisions()) {
            gameState = 'gameover';
            finalScoreDisplay.textContent = score;
            gameOverScreen.classList.remove('hidden');
            scoreDisplay.classList.add('hidden');
        }
    }
    
    // Dessiner les éléments du jeu
    for (let pipe of pipes) {
        drawPipe(pipe);
    }
    
    drawGround();
    drawBird();
    
    // Continuer la boucle d'animation
    animationId = requestAnimationFrame(gameLoop);
}

// Faire sauter l'oiseau
function jump() {
    if (gameState === 'playing') {
        bird.velocity = config.jumpForce;
    }
}

// Démarrer le jeu
function startGame() {
    gameState = 'playing';
    startScreen.classList.add('hidden');
    scoreDisplay.classList.remove('hidden');
    resetGame();
}

// Redémarrer le jeu - CORRIGÉE
function restartGame() {
    gameState = 'playing';
    gameOverScreen.classList.add('hidden');
    scoreDisplay.classList.remove('hidden');
    resetGame();
}

// Gestion des événements - CORRIGÉE
function setupEventListeners() {
    // Clic ou toucher pour sauter
    canvas.addEventListener('click', jump);
    
    // Touches pour sauter
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'KeyA') {
            e.preventDefault();
            jump();
        }
        
        // Touche B ou Entrée pour redémarrer
        if ((e.code === 'KeyB' || e.code === 'Enter') && gameState === 'gameover') {
            restartGame();
        }
        
        // Espace pour redémarrer aussi en game over
        if (e.code === 'Space' && gameState === 'gameover') {
            restartGame();
        }
    });
    
    // Boutons de démarrage et redémarrage
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', restartGame);
    
    // Boutons A et B de la GameBoy
    document.querySelector('.button-a').addEventListener('click', function() {
        if (gameState === 'playing') {
            jump();
        } else if (gameState === 'gameover') {
            restartGame();
        }
    });
    
    document.querySelector('.button-b').addEventListener('click', function() {
        if (gameState === 'gameover') {
            restartGame();
        } else if (gameState === 'playing') {
            jump();
        }
    });
}

// Initialisation du jeu
function init() {
    initCanvas();
    setupEventListeners();
    gameLoop();
}

// Démarrer le jeu
init();