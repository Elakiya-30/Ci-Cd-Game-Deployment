const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 600;
canvas.height = 800;

let gameLoopId;
let isPlaying = false;
let score = 0;
let uiScore = document.getElementById('score');

const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreEl = document.getElementById('final-score');

let player;
let bullets = [];
let enemies = [];
let particles = [];
let stars = [];

const actions = { left: false, right: false, fire: false };

window.addEventListener('keydown', e => {
    if(e.code === 'ArrowLeft') actions.left = true;
    if(e.code === 'ArrowRight') actions.right = true;
    if(e.code === 'Space') actions.fire = true;
});
window.addEventListener('keyup', e => {
    if(e.code === 'ArrowLeft') actions.left = false;
    if(e.code === 'ArrowRight') actions.right = false;
    if(e.code === 'Space') actions.fire = false;
});

const bindBtn = (id, action) => {
    const btn = document.getElementById(id);
    const press = (e) => { e.preventDefault(); actions[action] = true; };
    const release = (e) => { e.preventDefault(); actions[action] = false; };
    btn.addEventListener('mousedown', press);
    btn.addEventListener('touchstart', press);
    btn.addEventListener('mouseup', release);
    btn.addEventListener('mouseleave', release);
    btn.addEventListener('touchend', release);
};

bindBtn('btn-left', 'left');
bindBtn('btn-right', 'right');
bindBtn('btn-fire', 'fire');

class Player {
    constructor() {
        this.width = 40;
        this.height = 50;
        this.x = canvas.width / 2;
        this.y = canvas.height - 80;
        this.speed = 7;
        this.cooldown = 0;
        this.maxCooldown = 12;
    }
    
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        ctx.fillStyle = `rgba(0, 255, 255, ${Math.random() * 0.5 + 0.5})`;
        ctx.beginPath();
        ctx.moveTo(-10, this.height/2);
        ctx.lineTo(10, this.height/2);
        ctx.lineTo(0, this.height/2 + 20 + Math.random() * 15);
        ctx.fill();
        
        ctx.fillStyle = '#0ff';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#0ff';
        ctx.beginPath();
        ctx.moveTo(0, -this.height/2);
        ctx.lineTo(this.width/2, this.height/2); 
        ctx.lineTo(0, this.height/4); 
        ctx.lineTo(-this.width/2, this.height/2); 
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    update() {
        if (actions.left) this.x -= this.speed;
        if (actions.right) this.x += this.speed;
        
        if (this.x < this.width/2) this.x = this.width/2;
        if (this.x > canvas.width - this.width/2) this.x = canvas.width - this.width/2;
        
        if (this.cooldown > 0) this.cooldown--;
        
        if (actions.fire && this.cooldown <= 0) {
            bullets.push(new Bullet(this.x, this.y - this.height/2, -14, '#0ff', true));
            this.cooldown = this.maxCooldown;
        }
    }
}

class Bullet {
    constructor(x, y, vy, color, isPlayer) {
        this.x = x;
        this.y = y;
        this.vy = vy;
        this.color = color;
        this.isPlayer = isPlayer;
        this.width = 4;
        this.height = 20;
        this.markedForDeletion = false;
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        ctx.shadowBlur = 0;
    }
    update() {
        this.y += this.vy;
        if (this.y < -50 || this.y > canvas.height + 50) this.markedForDeletion = true;
    }
}

class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 30;
        this.vx = (Math.random() - 0.5) * 3;
        this.vy = 2 + Math.random() * 2;
        this.hp = 1;
        this.markedForDeletion = false;
        
        this.diveTime = Math.random() * 150 + 100;
        this.isDiving = false;
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        ctx.fillStyle = '#ff5e00';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff0000';
        
        ctx.beginPath();
        ctx.moveTo(0, this.height/2); 
        ctx.lineTo(-this.width/2, -this.height/2 + Math.sin(Date.now() * 0.015) * 6); 
        ctx.lineTo(0, -this.height/4); 
        ctx.lineTo(this.width/2, -this.height/2 + Math.sin(Date.now() * 0.015) * 6); 
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI*2);
        ctx.fill();
        
        ctx.restore();
    }
    update() {
        this.diveTime--;
        if (this.diveTime <= 0 && !this.isDiving) {
            this.isDiving = true;
            this.vx = (player.x - this.x) * 0.02; 
            this.vy = 6;
        }
        
        this.x += this.vx;
        this.y += this.vy;
        
        if (!this.isDiving) {
            if (this.x < 20 || this.x > canvas.width - 20) this.vx *= -1;
        }
        
        if (Math.random() < 0.005) {
            bullets.push(new Bullet(this.x, this.y + this.height/2, 8, '#f0f', false));
        }
        
        if (this.y > canvas.height + 50) this.markedForDeletion = true;
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 12;
        this.vy = (Math.random() - 0.5) * 12;
        this.life = 1;
        this.decay = Math.random() * 0.05 + 0.02;
        this.color = color;
        this.size = Math.random() * 3 + 1;
    }
    draw() {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1; 
        ctx.shadowBlur = 0;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }
}

class Star {
    constructor() {
        this.reset();
        this.y = Math.random() * canvas.height; 
    }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = 0;
        this.size = Math.random() * 2 + 0.5;
        this.speed = this.size * 1.5;
        this.opacity = Math.random() * 0.5 + 0.3;
    }
    draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
    update() {
        this.y += this.speed;
        if (this.y > canvas.height) this.reset();
    }
}

function init() {
    player = new Player();
    bullets = [];
    enemies = [];
    particles = [];
    score = 0;
    uiScore.innerText = score;
    actions.left = false;
    actions.right = false;
    actions.fire = false;
    
    stars = [];
    for(let i=0; i<100; i++) stars.push(new Star());
}

let enemySpawnTimer = 0;
function spawnEnemies() {
    enemySpawnTimer++;
    let spawnRate = Math.max(15, 50 - Math.floor(score / 500));
    
    if (enemySpawnTimer > spawnRate) {
        let x = Math.random() * (canvas.width - 80) + 40;
        enemies.push(new Enemy(x, -50));
        enemySpawnTimer = 0;
    }
}

function createExplosion(x, y, color) {
    for(let i=0; i<30; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function checkCollisions() {
    bullets.forEach(bullet => {
        if (bullet.isPlayer) {
            enemies.forEach(enemy => {
                if (!bullet.markedForDeletion && !enemy.markedForDeletion) {
                    let dx = bullet.x - enemy.x;
                    let dy = bullet.y - enemy.y;
                    let dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist < enemy.width/2 + bullet.width) {
                        enemy.hp--;
                        bullet.markedForDeletion = true;
                        createExplosion(bullet.x, bullet.y, '#0ff');
                        
                        if (enemy.hp <= 0) {
                            enemy.markedForDeletion = true;
                            createExplosion(enemy.x, enemy.y, '#ff5e00');
                            score += 100;
                            uiScore.innerText = score;
                        }
                    }
                }
            });
        } else {
            let dx = bullet.x - player.x;
            let dy = bullet.y - player.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < player.width/2) {
                gameOver();
            }
        }
    });
    
    enemies.forEach(enemy => {
        let dx = enemy.x - player.x;
        let dy = enemy.y - player.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < player.width/2 + enemy.width/2) {
            gameOver();
        }
    });
}

function gameOver() {
    isPlaying = false;
    createExplosion(player.x, player.y, '#0ff');
    createExplosion(player.x, player.y, '#fff');
    render(); 
    
    setTimeout(() => {
        gameOverScreen.classList.remove('hidden');
        finalScoreEl.innerText = score;
    }, 800);
}

function render() {
    ctx.fillStyle = 'rgba(5, 5, 12, 0.35)'; // Motion blur trail effect
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    stars.forEach(s => { s.update(); s.draw(); });
    
    if (isPlaying) {
        player.update();
        player.draw();
        spawnEnemies();
    }
    
    bullets.forEach(b => { b.update(); b.draw(); });
    bullets = bullets.filter(b => !b.markedForDeletion);
    
    enemies.forEach(e => { e.update(); e.draw(); });
    enemies = enemies.filter(e => !e.markedForDeletion);
    
    particles.forEach(p => { p.update(); p.draw(); });
    particles = particles.filter(p => p.life > 0);
    
    if (isPlaying) checkCollisions();
}

function loop() {
    render();
    if (isPlaying || particles.length > 0) {
        gameLoopId = requestAnimationFrame(loop);
    }
}

document.getElementById('start-btn').addEventListener('click', () => {
    startScreen.classList.add('hidden');
    init();
    isPlaying = true;
    cancelAnimationFrame(gameLoopId);
    loop();
});

document.getElementById('restart-btn').addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    init();
    isPlaying = true;
    cancelAnimationFrame(gameLoopId);
    loop();
});

init();
render();
