class Sprite {
    constructor(color, width, height) {
        this.color = color;
        this.width = width;
        this.height = height;
    }

    draw(ctx, x, y) {
        ctx.fillStyle = this.color;
        ctx.fillRect(x, y, this.width, this.height);
    }
}

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        // Set exact size to 32x32
        this.width = 32;   
        this.height = 32;  
        this.speed = 3;
        this.direction = 'down';
        this.isMoving = false;
        
        // Load the sprite image
        this.sprite = new Image();
        this.sprite.src = 'charsprite.png';
        
        // Hitbox now matches sprite exactly
        this.hitboxOffsetX = 0;  // No offset
        this.hitboxOffsetY = 0;  // No offset
        this.hitboxWidth = this.width;    // Full width
        this.hitboxHeight = this.height;  // Full height
        this.lightRadius = 150;
        this.lightsOn = true;
    }

    getHitbox() {
        return {
            x: this.x,  // No offset needed
            y: this.y,  // No offset needed
            width: this.width,
            height: this.height
        };
    }

    checkCollision(x, y, object) {
        // Simplified collision check since hitbox matches sprite exactly
        return x < (object.x + object.width) &&
               (x + this.width) > object.x &&
               y < (object.y + object.height) &&
               (y + this.height) > object.y;
    }

    draw(ctx) {
        // Draw the sprite with pixel-perfect scaling
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);

        // Debug: Draw hitbox (now matches sprite exactly)
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }

    move(dx, dy, walls, doors) {
        const newX = this.x + dx * this.speed;
        const newY = this.y + dy * this.speed;

        if (dx > 0) this.direction = 'right';
        else if (dx < 0) this.direction = 'left';
        else if (dy > 0) this.direction = 'down';
        else if (dy < 0) this.direction = 'up';

        this.isMoving = dx !== 0 || dy !== 0;

        let canMove = true;
        for (let wall of walls) {
            if (this.checkCollision(newX, newY, wall)) {
                canMove = false;
                break;
            }
        }

        for (let door of doors) {
            if (!door.isOpen && this.checkCollision(newX, newY, door)) {
                canMove = false;
                break;
            }
        }

        if (canMove) {
            this.x = newX;
            this.y = newY;
        }
    }

    toggleLight() {
        this.lightsOn = !this.lightsOn;
    }
}

class Wall {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.sprite = new Sprite('#8b4513', width, height);
    }

    draw(ctx) {
        this.sprite.draw(ctx, this.x, this.y);
    }
}

class InteractiveObject {
    constructor(x, y, width, height, type, textureOrColor) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.isInteracting = false;

        // Check if the texture is a string ending with an image extension
        if (typeof textureOrColor === 'string' && 
            (textureOrColor.endsWith('.png') || 
             textureOrColor.endsWith('.jpg') || 
             textureOrColor.endsWith('.jpeg'))) {
            // It's an image texture
            this.texture = new Image();
            this.texture.src = textureOrColor;
            this.color = null;
        } else {
            // It's a color
            this.color = textureOrColor;
            this.texture = null;
        }
    }

    draw(ctx) {
        if (this.texture && this.texture.complete) {
            // Draw with texture
            ctx.imageSmoothingEnabled = false;  // For pixel art textures
            ctx.drawImage(this.texture, this.x, this.y, this.width, this.height);
        } else if (this.color) {
            // Draw with color
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        // Draw interaction text if needed
        if (this.isInteracting) {
            ctx.fillStyle = 'black';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            
            const text = this.type;
            const textWidth = ctx.measureText(text).width;
            const padding = 4;
            
            // Draw text background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(
                this.x + (this.width/2) - (textWidth/2) - padding,
                this.y - 25,
                textWidth + (padding * 2),
                20
            );
            
            // Draw text
            ctx.fillStyle = 'black';
            ctx.fillText(text, this.x + this.width/2, this.y - 8);
        }
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.canvas.width = 800;
        this.canvas.height = 600;

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        const houseWidth = 600;
        const houseHeight = 400;
        
        const houseStartX = centerX - (houseWidth / 2);
        const houseStartY = centerY - (houseHeight / 2);

        this.player = new Player(centerX, centerY);

        // Create house layout with front door opening
        this.walls = [
            // Outer walls
            new Wall(houseStartX, houseStartY, houseWidth, 20),  // Top
            new Wall(houseStartX, houseStartY, 20, houseHeight),  // Left
            new Wall(houseStartX + houseWidth - 20, houseStartY, 20, houseHeight),  // Right
            
            // Bottom walls with door opening
            new Wall(houseStartX, houseStartY + houseHeight - 20, 260, 20),  // Bottom left
            new Wall(houseStartX + 340, houseStartY + houseHeight - 20, 260, 20),  // Bottom right

            // Inner walls
            new Wall(houseStartX + 200, houseStartY, 20, 200),  // Room divider 1
            new Wall(houseStartX + 200, houseStartY + 300, 20, 100),  // Room divider 2
            new Wall(houseStartX + 400, houseStartY, 20, 300),  // Room divider 3
        ];

        // Create interactive objects with adjusted positions
        this.interactiveObjects = [
            // Bedroom 1
            new InteractiveObject(houseStartX + 50, houseStartY + 50, 80, 40, "Bed", "bedtexture.png"),
            new InteractiveObject(houseStartX + 50, houseStartY + 100, 40, 40, "Dresser", "#deb887"),
            
            // Bedroom 2
            new InteractiveObject(houseStartX + 250, houseStartY + 50, 80, 40, "Bed", "bedtexture.png"),
            new InteractiveObject(houseStartX + 250, houseStartY + 100, 40, 40, "Closet", "#deb887"),
            
            // Living Room (moved TV and adjusted sofa)
            new InteractiveObject(houseStartX + 450, houseStartY + 200, 100, 60, "Sofa", "#808080"),
            new InteractiveObject(houseStartX + 450, houseStartY + 150, 40, 40, "TV", "#000000"),
            
            // Kitchen
            new InteractiveObject(houseStartX + 450, houseStartY + 50, 100, 40, "Counter", "#a9a9a9"),
            new InteractiveObject(houseStartX + 450, houseStartY + 100, 60, 60, "Fridge", "#c0c0c0"),
            
            // Dining Room (moved table)
            new InteractiveObject(houseStartX + 250, houseStartY + 200, 80, 80, "Table", "#8b4513"),
        ];

        // Store house bounds for floor drawing
        this.houseBounds = {
            x: houseStartX,
            y: houseStartY,
            width: houseWidth,
            height: houseHeight
        };

        // Load floor texture
        this.floorTexture = new Image();
        this.floorTexture.src = 'housefloor.jpg';

        // Input handling
        this.keys = {};
        this.keyHandler = (e) => {
            this.keys[e.key] = e.type === 'keydown';
        };
        
        window.addEventListener('keydown', this.keyHandler);
        window.addEventListener('keyup', this.keyHandler);

        // Start game loop only after initialization
        requestAnimationFrame(() => this.gameLoop());
    }

    destroy() {
        // Clean up event listeners when returning to menu
        window.removeEventListener('keydown', this.keyHandler);
        window.removeEventListener('keyup', this.keyHandler);
    }

    handleInteraction() {
        // Check for door interaction
        for (let door of this.doors) {
            if (this.player.checkCollision(this.player.x, this.player.y, {
                x: door.x - 20,
                y: door.y - 20,
                width: door.width + 40,
                height: door.height + 40
            })) {
                door.toggle();
                return;
            }
        }

        // Check for object interaction
        for (let obj of this.interactiveObjects) {
            if (this.player.checkCollision(this.player.x, this.player.y, {
                x: obj.x - 20,
                y: obj.y - 20,
                width: obj.width + 40,
                height: obj.height + 40
            })) {
                obj.isInteracting = !obj.isInteracting;
            } else {
                obj.isInteracting = false;
            }
        }
    }

    update() {
        // Handle player movement
        let dx = 0;
        let dy = 0;

        if (this.keys['ArrowUp'] || this.keys['w']) dy = -1;
        if (this.keys['ArrowDown'] || this.keys['s']) dy = 1;
        if (this.keys['ArrowLeft'] || this.keys['a']) dx = -1;
        if (this.keys['ArrowRight'] || this.keys['d']) dx = 1;

        // Updated to only check walls for collision
        this.player.move(dx, dy, this.walls, []);

        // Check for interactions
        for (let obj of this.interactiveObjects) {
            obj.isInteracting = this.isPlayerNear(obj);
        }
    }

    isPlayerNear(object) {
        const interactionDistance = 40; // Distance for interaction
        const playerCenter = {
            x: this.player.x + this.player.width/2,
            y: this.player.y + this.player.height/2
        };
        const objectCenter = {
            x: object.x + object.width/2,
            y: object.y + object.height/2
        };
        
        const distance = Math.sqrt(
            Math.pow(playerCenter.x - objectCenter.x, 2) +
            Math.pow(playerCenter.y - objectCenter.y, 2)
        );
        
        return distance < interactionDistance;
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#e8e8e8';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw floor
        this.drawFloorTiles();

        // Draw walls
        for (let wall of this.walls) {
            wall.draw(this.ctx);
        }

        // Draw interactive objects
        for (let obj of this.interactiveObjects) {
            obj.draw(this.ctx);
        }

        // Draw player
        this.player.draw(this.ctx);
    }

    drawFloorTiles() {
        const tileSize = 40;

        // Draw green tiles outside house
        this.ctx.fillStyle = '#4CAF50';  // Nice grass green color
        
        // Fill entire canvas with green first
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid pattern over green tiles outside house
        this.ctx.strokeStyle = '#45a049';  // Slightly darker green for grid
        this.ctx.lineWidth = 1;

        for (let x = 0; x < this.canvas.width; x += tileSize) {
            for (let y = 0; y < this.canvas.height; y += tileSize) {
                // Check if this tile is outside the house
                if (x < this.houseBounds.x || 
                    x >= this.houseBounds.x + this.houseBounds.width ||
                    y < this.houseBounds.y || 
                    y >= this.houseBounds.y + this.houseBounds.height) {
                    this.ctx.strokeRect(x, y, tileSize, tileSize);
                }
            }
        }

        // Draw house floor as one image
        if (this.floorTexture.complete) {
            const pattern = this.ctx.createPattern(this.floorTexture, 'repeat');
            if (pattern) {
                this.ctx.fillStyle = pattern;
                this.ctx.fillRect(
                    this.houseBounds.x,
                    this.houseBounds.y,
                    this.houseBounds.width,
                    this.houseBounds.height
                );
            }
        }
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Remove the automatic game creation
// The game will now be created when the Play button is clicked 