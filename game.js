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
        // Set exact size to match sprite display
        this.width = 32;   
        this.height = 32;  
        this.direction = 'down';
        this.isMoving = false;
        this.isSprinting = false;
        
        // Enhanced movement system with personality-based variations
        this.velocityX = 0;
        this.velocityY = 0;
        this.baseWalkSpeed = 1.5;
        this.baseSprintSpeed = 5;
        this.currentMaxSpeed = this.baseWalkSpeed;
        this.acceleration = 0.3;
        this.friction = 0.85;
        
        // Character-specific attributes
        this.currentCharacterData = null;
        
        // Enhanced player stats
        this.energy = 100;
        this.maxEnergy = 100;
        this.sprintEnergyDecayRate = 0.08;
        this.inventory = [];
        this.maxInventorySize = 10;
        
        // Interaction system
        this.interactionRange = 50;
        this.lastInteractionTime = 0;
        this.interactionCooldown = 500;
        
        // Enhanced sprite system
        this.spriteSheet = null;
        this.spriteWidth = 16;   // Back to 16x16 sprites  
        this.spriteHeight = 16;  // Back to 16x16 sprites
        this.spriteScale = 2;    // Scale to 32x32 for display
        this.currentFrame = 0;
        
        // Improved hitbox for better gameplay
        this.hitboxOffsetX = 4;  // Restored original values
        this.hitboxOffsetY = 8;  
        this.hitboxWidth = 24;   
        this.hitboxHeight = 20;
        this.lightRadius = 150;
        this.lightsOn = true;
        
        // Enhanced animation
        this.animationFrame = 0;
        this.baseWalkAnimationSpeed = 0.15;
        this.baseSprintAnimationSpeed = 0.3;
        this.walkCycle = 0;
        
        // Time-based animation for Jake's frames
        this.animationTimer = 0;
        this.frameChangeInterval = 50; // 0.05 seconds in milliseconds
        
        // Character expression system
        this.facialExpression = "neutral";
        this.expressionTimer = 0;
        this.expressions = ["neutral", "happy", "focused", "tired", "excited"];
    }

    getHitbox() {
        return {
            x: this.x + this.hitboxOffsetX,
            y: this.y + this.hitboxOffsetY,
            width: this.hitboxWidth,
            height: this.hitboxHeight
        };
    }

    checkCollision(x, y, object) {
        // Use the actual hitbox for collision detection
        const hitbox = {
            x: x + this.hitboxOffsetX,
            y: y + this.hitboxOffsetY,
            width: this.hitboxWidth,
            height: this.hitboxHeight
        };
        
        return hitbox.x < (object.x + object.width) &&
               (hitbox.x + hitbox.width) > object.x &&
               hitbox.y < (object.y + object.height) &&
               (hitbox.y + hitbox.height) > object.y;
    }

    draw(ctx) {
        // Draw the sprite with pixel-perfect scaling
        ctx.imageSmoothingEnabled = false;
        
        // Add slight transparency and color tint when sprinting
        if (this.isSprinting) {
            ctx.save();
            ctx.globalAlpha = 0.9;
            ctx.filter = 'hue-rotate(10deg)';
        }

        // Try to draw sprite sheet first, fallback to canvas drawing
        if (this.frameImages && this.currentCharacterData.useIndividualFrames) {
            this.drawIndividualFrames(ctx);
        } else if (this.spriteSheet && this.spriteSheet.complete) {
            this.drawSpriteSheet(ctx);
        } else {
            this.drawCanvasCharacter(ctx);
        }
        
        if (this.isSprinting) {
            ctx.restore();
        }
    }

    drawSpriteSheet(ctx) {
        // Custom sprite sheet drawing for user-created characters
        try {
            // Calculate sprite sheet layout
            const spritesPerRow = Math.floor(this.spriteSheet.width / this.spriteWidth);
            const spritesPerCol = Math.floor(this.spriteSheet.height / this.spriteHeight);
            
            let frameX = 0;
            let frameY = 0;
            
            // Custom animation logic for characters with custom frames
            if (this.customFrames) {
                if (this.isMoving && this.customFrames.walk) {
                    // Walking animation: use custom walk frames
                    const walkCycleStep = Math.floor(this.walkCycle * 4) % this.customFrames.walk.length;
                    const frame = this.customFrames.walk[walkCycleStep];
                    frameX = frame.x * this.spriteWidth;
                    frameY = frame.y * this.spriteHeight;
                } else if (this.customFrames.idle) {
                    // Idle animation: use custom idle frame
                    frameX = this.customFrames.idle.x * this.spriteWidth;
                    frameY = this.customFrames.idle.y * this.spriteHeight;
                }
            } else {
                // Default animation logic for other characters
                if (this.isMoving && spritesPerRow >= 3) {
                    // Use first 3 frames for walking animation
                    const frameIndex = Math.floor(this.walkCycle * 3) % 3;
                    frameX = frameIndex * this.spriteWidth;
                    
                    // Try to use direction-based rows if available
                    if (spritesPerCol >= 4) {
                        frameY = this.getDirectionRow() * this.spriteHeight;
                    }
                } else if (!this.isMoving && spritesPerRow >= 2) {
                    // Use second frame for idle if available
                    frameX = this.spriteWidth;
                }
            }
            
            // Safety bounds checking
            frameX = Math.min(frameX, this.spriteSheet.width - this.spriteWidth);
            frameY = Math.min(frameY, this.spriteSheet.height - this.spriteHeight);
            frameX = Math.max(0, frameX);
            frameY = Math.max(0, frameY);
            
            // Draw the sprite frame
            ctx.drawImage(
                this.spriteSheet,
                frameX, frameY, this.spriteWidth, this.spriteHeight,
                this.x, this.y, this.width, this.height
            );
            
        } catch (error) {
            // Sprite drawing failed, using canvas fallback
            this.drawCanvasCharacter(ctx);
        }
    }

    drawCanvasCharacter(ctx) {
        // Character definitions with unique visual styles
        const characters = {
            "Jake": {
                bodyColor: '#FFDBAC',
                shirtColor: '#2196F3',
                hairColor: '#8B4513'
            },
            "Bob": {
                bodyColor: '#4CAF50',
                shirtColor: '#2E7D32',
                hairColor: '#8D6E63'
            },
            "Amelia": {
                bodyColor: '#FFE0B2',
                shirtColor: '#E91E63',
                hairColor: '#FF6F00'
            },
            "Alex": {
                bodyColor: '#FFCCBC',
                shirtColor: '#2196F3',
                hairColor: '#5D4037'
            },
            "Adam": {
                bodyColor: '#F3E5AB',
                shirtColor: '#FF9800',
                hairColor: '#424242'
            }
        };
        
        const character = characters[this.currentCharacterName] || characters["Bob"];
        
        // Body
        ctx.fillStyle = character.bodyColor;
        ctx.fillRect(this.x + 6, this.y + 8, 20, 24);
        
        // Shirt
        ctx.fillStyle = character.shirtColor;
        ctx.fillRect(this.x + 8, this.y + 12, 16, 16);
        
        // Head
        ctx.fillStyle = character.bodyColor;
        ctx.fillRect(this.x + 8, this.y + 2, 16, 12);
        
        // Hair
        ctx.fillStyle = character.hairColor;
        ctx.fillRect(this.x + 8, this.y, 16, 6);
        
        // Eyes
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x + 10, this.y + 6, 2, 2);
        ctx.fillRect(this.x + 20, this.y + 6, 2, 2);
        
        // Mouth
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x + 14, this.y + 10, 4, 1);
        
        // Legs
        ctx.fillStyle = '#1976D2';
        ctx.fillRect(this.x + 8, this.y + 28, 6, 4);
        ctx.fillRect(this.x + 18, this.y + 28, 6, 4);
        
        // Simple walking animation
        if (this.isMoving) {
            const offset = Math.sin(this.walkCycle * Math.PI * 8) * 2;
            
            // Animate legs
            ctx.fillStyle = '#1976D2';
            ctx.fillRect(this.x + 8 + offset, this.y + 28, 6, 4);
            ctx.fillRect(this.x + 18 - offset, this.y + 28, 6, 4);
            
            // Slight body bob
            const bobOffset = Math.abs(offset) * 0.5;
            ctx.fillStyle = character.shirtColor;
            ctx.fillRect(this.x + 8, this.y + 12 - bobOffset, 16, 16);
        }
    }

    // Enhanced character setting with personality integration
    setCharacter(characterData) {
        this.currentCharacterData = characterData;
        this.currentCharacterName = characterData.name;
        
        if (characterData.useIndividualFrames) {
            // Load individual frame files for Jake
            this.frameImages = {};
            this.spriteSheet = null; // Don't use sprite sheet
            
            // Load idle frame
            this.frameImages.idle = new Image();
            this.frameImages.idle.src = characterData.frameFiles.idle;
            this.frameImages.idle.onload = () => {
                console.log(`Loaded ${characterData.displayName} idle frame`);
            };
            
            // Load walk frame
            this.frameImages.walk = new Image();
            this.frameImages.walk.src = characterData.frameFiles.walk;
            this.frameImages.walk.onload = () => {
                console.log(`Loaded ${characterData.displayName} walk frame`);
            };
            
            this.spriteWidth = characterData.frameWidth;
            this.spriteHeight = characterData.frameHeight;
            this.spriteScale = characterData.scale;
        } else {
            // Original sprite sheet loading
            this.spriteSheet = new Image();
            this.spriteSheet.src = characterData.spriteSheet;
            this.spriteWidth = characterData.frameWidth;
            this.spriteHeight = characterData.frameHeight;
            this.spriteScale = characterData.scale;
            
            // Set custom frame positions if provided
            if (characterData.customFrames) {
                this.customFrames = characterData.customFrames;
            }
            
            this.spriteSheet.onload = () => {
                console.log(`Loaded ${characterData.displayName} custom sprite`);
            };
            
            this.spriteSheet.onerror = () => {
                console.log(`Sprite not found for ${characterData.name}, using fallback`);
                this.spriteSheet = null;
            };
        }
    }

    // Method to set custom frame positions for characters
    setCustomFrames(idleFrame, walkFrames) {
        this.customFrames = {
            idle: idleFrame,
            walk: walkFrames
        };
    }

    // Apply character personality to movement and behavior
    applyPersonalityModifiers(characterData) {
        // Adjust movement based on character traits
        switch(characterData.walkStyle) {
            case "measured":
                this.personalityModifiers.walkSpeed = 0.9;
                this.personalityModifiers.sprintSpeed = 1.1;
                break;
            case "confident":
                this.personalityModifiers.walkSpeed = 1.1;
                this.personalityModifiers.sprintSpeed = 1.2;
                break;
            case "graceful":
                this.personalityModifiers.walkSpeed = 1.0;
                this.personalityModifiers.sprintSpeed = 0.9;
                this.baseWalkAnimationSpeed = 0.12; // Smoother animation
                break;
            case "alert":
                this.personalityModifiers.walkSpeed = 1.05;
                this.personalityModifiers.sprintSpeed = 1.3;
                break;
        }
        
        // Apply energy recovery rate from character data
        this.personalityModifiers.energyRecovery = characterData.energyRecoveryRate || 1.0;
        
        // Set initial mood based on personality
        switch(characterData.personality) {
            case "Intellectual":
                this.currentMood = "Focused";
                break;
            case "Practical":
                this.currentMood = "Relaxed";
                break;
            case "Creative":
                this.currentMood = "Inspired";
                break;
            case "Resilient":
                this.currentMood = "Energetic";
                break;
        }
    }

    // Method to load sprite sheet from assets folder (legacy support)
    loadSpriteSheet(spriteSheetPath, frameWidth = 16, frameHeight = 16, scale = 2) {
        this.spriteSheet = new Image();
        this.spriteSheet.src = spriteSheetPath;
        this.spriteWidth = frameWidth;
        this.spriteHeight = frameHeight;
        this.spriteScale = scale;
        
        this.spriteSheet.onload = () => {
            console.log(`Sprite sheet loaded: ${spriteSheetPath}`);
        };
        
        this.spriteSheet.onerror = () => {
            console.log(`Failed to load sprite sheet: ${spriteSheetPath}`);
            this.spriteSheet = null;
        };
    }

    // Helper method for sprite sheet direction mapping
    getDirectionRow() {
        // Most RPG sprite sheets use this layout:
        // Row 0: Down/Front facing
        // Row 1: Left facing  
        // Row 2: Right facing
        // Row 3: Up/Back facing
        switch(this.direction) {
            case 'down': return 0;
            case 'left': return 1;
            case 'right': return 2;
            case 'up': return 3;
            default: return 0;
        }
    }

    // Get the number of frames per direction (usually 3-4 for walking animation)
    getFramesPerDirection() {
        return 3; // Use 3 frames for more stable animation - [idle, walk1, walk2]
    }

    move(dx, dy, walls, doors) {
        // Apply acceleration based on input
        if (dx !== 0 || dy !== 0) {
            // Normalize diagonal movement
            const magnitude = Math.sqrt(dx * dx + dy * dy);
            if (magnitude > 0) {
                dx /= magnitude;
                dy /= magnitude;
            }
            
            this.velocityX += dx * this.acceleration;
            this.velocityY += dy * this.acceleration;
            
            // Cap velocity to max speed
            const currentSpeed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
            if (currentSpeed > this.currentMaxSpeed) {
                this.velocityX = (this.velocityX / currentSpeed) * this.currentMaxSpeed;
                this.velocityY = (this.velocityY / currentSpeed) * this.currentMaxSpeed;
            }
        }

        // Update direction based on movement
        if (Math.abs(this.velocityX) > Math.abs(this.velocityY)) {
            this.direction = this.velocityX > 0 ? 'right' : 'left';
        } else if (Math.abs(this.velocityY) > 0.1) {
            this.direction = this.velocityY > 0 ? 'down' : 'up';
        }

        this.isMoving = Math.abs(this.velocityX) > 0.1 || Math.abs(this.velocityY) > 0.1;

        // Calculate next position
        const nextX = this.x + this.velocityX;
        const nextY = this.y + this.velocityY;

        // Check collision for X movement
        let canMoveX = true;
        for (let wall of walls) {
            if (this.checkCollision(nextX, this.y, wall)) {
                canMoveX = false;
                this.velocityX = 0; // Stop X velocity on collision
                break;
            }
        }

        // Check collision for Y movement  
        let canMoveY = true;
        for (let wall of walls) {
            if (this.checkCollision(this.x, nextY, wall)) {
                canMoveY = false;
                this.velocityY = 0; // Stop Y velocity on collision
                break;
            }
        }

        // Check door collisions
        for (let door of doors) {
            if (!door.isOpen) {
                if (this.checkCollision(nextX, this.y, door)) {
                    canMoveX = false;
                    this.velocityX = 0;
                }
                if (this.checkCollision(this.x, nextY, door)) {
                    canMoveY = false;
                    this.velocityY = 0;
                }
            }
        }

        // Apply movement if no collision
        if (canMoveX) {
            this.x = nextX;
        }
        if (canMoveY) {
            this.y = nextY;
        }
    }

    toggleLight() {
        this.lightsOn = !this.lightsOn;
    }

    // Enhanced update method with personality-aware behavior
    update(deltaTime, isSprinting = false) {
        // Can only sprint if energy is above minimum threshold
        const minSprintEnergy = 10;
        this.isSprinting = isSprinting && this.energy > minSprintEnergy && this.isMoving;
        this.currentMaxSpeed = this.isSprinting ? this.baseSprintSpeed : this.baseWalkSpeed;
        
        // Update energy - only drain when sprinting
        if (this.isMoving && this.isSprinting) {
            this.energy = Math.max(0, this.energy - this.sprintEnergyDecayRate * deltaTime);
            
            // If energy drops to zero while sprinting, force stop
            if (this.energy <= 0) {
                this.isSprinting = false;
                this.currentMaxSpeed = this.baseWalkSpeed;
            }
        } else if (this.energy < this.maxEnergy) {
            // Regenerate energy when not sprinting (faster when not moving)
            const regenRate = this.isMoving ? 0.03 : 0.06;
            this.energy = Math.min(this.maxEnergy, this.energy + regenRate * deltaTime);
        }

        // Update animation
        const animationSpeed = this.isSprinting ? this.baseSprintAnimationSpeed : this.baseWalkAnimationSpeed;
        
        if (this.isMoving) {
            this.walkCycle += animationSpeed * (deltaTime / 16.67); // Normalize for 60fps
            
            // Keep walk cycle within bounds (0 to 1 for simple animation)
            if (this.walkCycle >= 1) {
                this.walkCycle = 0;
            }
            
            // Update animation timer for Jake's frames
            this.animationTimer += deltaTime;
        } else {
            // Reset animation when not moving
            this.walkCycle = 0;
            this.animationTimer = 0;
        }

        // Apply friction to velocities
        this.velocityX *= this.friction;
        this.velocityY *= this.friction;
    }

    // Basic collision detection with walls
    handleCollisions(walls) {
        if (!walls) return;
        
        walls.forEach(wall => {
            if (this.checkCollision(wall)) {
                // Simple collision response - separate from wall
                this.separateFromWall(wall);
            }
        });
    }

    // Check if player collides with a wall
    checkCollision(wall) {
        return this.x + this.hitboxOffsetX < wall.x + wall.width &&
               this.x + this.hitboxOffsetX + this.hitboxWidth > wall.x &&
               this.y + this.hitboxOffsetY < wall.y + wall.height &&
               this.y + this.hitboxOffsetY + this.hitboxHeight > wall.y;
    }

    // Separate player from wall
    separateFromWall(wall) {
        const playerCenterX = this.x + this.hitboxOffsetX + this.hitboxWidth / 2;
        const playerCenterY = this.y + this.hitboxOffsetY + this.hitboxHeight / 2;
        const wallCenterX = wall.x + wall.width / 2;
        const wallCenterY = wall.y + wall.height / 2;

        const overlapX = (this.hitboxWidth + wall.width) / 2 - Math.abs(playerCenterX - wallCenterX);
        const overlapY = (this.hitboxHeight + wall.height) / 2 - Math.abs(playerCenterY - wallCenterY);

        if (overlapX < overlapY) {
            // Separate horizontally
            if (playerCenterX < wallCenterX) {
                this.x = wall.x - this.hitboxOffsetX - this.hitboxWidth;
            } else {
                this.x = wall.x + wall.width - this.hitboxOffsetX;
            }
            this.velocityX = 0;
        } else {
            // Separate vertically
            if (playerCenterY < wallCenterY) {
                this.y = wall.y - this.hitboxOffsetY - this.hitboxHeight;
            } else {
                this.y = wall.y + wall.height - this.hitboxOffsetY;
            }
            this.velocityY = 0;
        }
    }

    // Mood system for dynamic character behavior
    updateMood(deltaTime) {
        this.moodTimer += deltaTime;
        if (this.moodTimer >= this.moodChangeInterval) {
            // Randomly change mood based on current activity and personality
            const moodOptions = this.getMoodOptionsForPersonality();
            this.currentMood = moodOptions[Math.floor(Math.random() * moodOptions.length)];
            this.moodTimer = 0;
        }
    }

    getMoodOptionsForPersonality() {
        if (!this.currentCharacterData) return ["Focused"];
        
        switch(this.currentCharacterData.personality) {
            case "Intellectual":
                return ["Focused", "Inspired", "Tired"];
            case "Practical":
                return ["Focused", "Relaxed", "Energetic"];
            case "Creative":
                return ["Inspired", "Energetic", "Relaxed"];
            case "Resilient":
                return ["Energetic", "Focused", "Alert"];
            default:
                return ["Focused"];
        }
    }

    // Enhanced energy system with personality and mood integration
    updateEnergyWithPersonality(deltaTime) {
        let energyChange = 0;
        
        if (this.isSprinting && this.energy > 0) {
            // Apply sprint energy drain with mood effects
            const moodEffect = this.getMoodEffect();
            energyChange = -this.sprintEnergyDecayRate * moodEffect.energyDrain;
        } else if (!this.isMoving) {
            // Recovery when idle, affected by personality and mood
            const recoveryRate = this.baseEnergyRecoveryRate * this.personalityModifiers.energyRecovery;
            energyChange = recoveryRate;
        }
        
        this.energy = Math.max(0, Math.min(this.maxEnergy, this.energy + energyChange));
        
        // Update current max speed based on energy and personality
        this.updateSpeedWithPersonality();
    }

    updateSpeedWithPersonality() {
        if (this.energy <= 0) {
            this.isSprinting = false;
        }
        
        const walkSpeed = this.baseWalkSpeed * this.personalityModifiers.walkSpeed;
        const sprintSpeed = this.baseSprintSpeed * this.personalityModifiers.sprintSpeed;
        
        this.currentMaxSpeed = this.isSprinting && this.energy > 0 ? sprintSpeed : walkSpeed;
    }

    getMoodEffect() {
        // This would be set by the SpriteManager's moodEffects
        return {
            energyDrain: 1.0,
            interactionSpeed: 1.0
        };
    }

    // Enhanced animation with personality-based timing
    updateAnimationWithPersonality(deltaTime) {
        if (this.isMoving) {
            const baseSpeed = this.isSprinting ? this.baseSprintAnimationSpeed : this.baseWalkAnimationSpeed;
            const personalityMultiplier = this.getAnimationSpeedMultiplier();
            this.walkCycle += baseSpeed * personalityMultiplier * deltaTime;
        }
    }

    getAnimationSpeedMultiplier() {
        if (!this.currentCharacterData) return 1.0;
        
        switch(this.currentCharacterData.walkStyle) {
            case "graceful":
                return 0.8; // Smoother, more deliberate
            case "alert":
                return 1.2; // Quick, reactive
            case "confident":
                return 1.1; // Steady, assured
            default:
                return 1.0;
        }
    }

    // Simple expression system
    updateExpression(deltaTime) {
        this.expressionTimer += deltaTime;
        if (this.expressionTimer >= 5000) { // Change expression every 5 seconds
            this.facialExpression = this.expressions[Math.floor(Math.random() * this.expressions.length)];
            this.expressionTimer = 0;
        }
    }

    addToInventory(item) {
        if (this.inventory.length < this.maxInventorySize) {
            this.inventory.push(item);
            return true;
        }
        return false; // Inventory full
    }

    removeFromInventory(itemName) {
        const index = this.inventory.findIndex(item => item.name === itemName);
        if (index !== -1) {
            return this.inventory.splice(index, 1)[0];
        }
        return null;
    }

    canInteract() {
        const currentTime = Date.now();
        return currentTime - this.lastInteractionTime > this.interactionCooldown;
    }

    interact() {
        if (this.canInteract()) {
            this.lastInteractionTime = Date.now();
            return true;
        }
        return false;
    }

    // Enhanced interaction handling with personality effects
    handleInteractions(interactiveObjects) {
        if (!interactiveObjects) return;
        
        const moodEffect = this.getMoodEffect();
        const adjustedCooldown = this.interactionCooldown / moodEffect.interactionSpeed;
        
        const currentTime = Date.now();
        if (currentTime - this.lastInteractionTime < adjustedCooldown) {
            return;
        }
        
        interactiveObjects.forEach(obj => {
            const distance = Math.sqrt(
                (this.x + this.width/2 - (obj.x + obj.width/2)) ** 2 +
                (this.y + this.height/2 - (obj.y + obj.height/2)) ** 2
            );
            
            if (distance <= this.interactionRange) {
                obj.setNearPlayer(true);
            } else {
                obj.setNearPlayer(false);
            }
        });
    }

    drawIndividualFrames(ctx) {
        // Draw individual frame images for Jake
        let currentImage = this.frameImages.walk; // Always use walk sprite sheet for animation
        
        // Draw the image (adjust dimensions if needed)
        if (currentImage && currentImage.complete) {
            try {
                let frameIndex = 0;
                
                if (this.isMoving) {
                    // Direction-based frame selection with alternating animation
                    let baseFrameIndex = 0;
                    
                    // Select base frame based on direction
                    switch(this.direction) {
                        case 'down':
                            baseFrameIndex = 0; // Frames 0-1 for down
                            break;
                        case 'up':
                            baseFrameIndex = 2; // Frames 2-3 for up
                            break;
                        case 'left':
                        case 'right':
                            baseFrameIndex = 0; // Use down frames for left/right (fallback)
                            break;
                        default:
                            baseFrameIndex = 0;
                    }
                    
                    // Alternate between the 2 frames for this direction every 0.05 seconds
                    const alternateFrame = Math.floor(this.animationTimer / this.frameChangeInterval) % 2;
                    frameIndex = baseFrameIndex + alternateFrame;
                    
                } else {
                    // Idle: use idle sprite sheet, frame 0
                    currentImage = this.frameImages.idle;
                    frameIndex = 0;
                }
                
                // Calculate frame position (4 frames horizontally)
                const frameX = frameIndex * this.spriteWidth; // 0, 64, 128, or 192
                const frameY = 0; // Only 1 row
                
                // Debug info
                if (this.debugOnce !== true) {
                    console.log(`Image dimensions: ${currentImage.width}x${currentImage.height}`);
                    console.log(`Frame size: ${this.spriteWidth}x${this.spriteHeight}`);
                    console.log(`Direction: ${this.direction}, Frame index: ${frameIndex}, Position: ${frameX}x${frameY}`);
                    this.debugOnce = true;
                }
                
                // Extract specific frame from sprite sheet
                ctx.drawImage(
                    currentImage,
                    frameX, frameY, this.spriteWidth, this.spriteHeight, // Source: specific 64x64 frame
                    this.x, this.y, this.width, this.height              // Destination: scaled to player size
                );
                
            } catch (error) {
                console.log("Error drawing image, using canvas fallback:", error);
                this.drawCanvasCharacter(ctx);
            }
        } else {
            // Fallback to canvas drawing if image isn't loaded yet
            this.drawCanvasCharacter(ctx);
        }
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
    constructor(x, y, width, height, type, textureOrColor, options = {}) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.isInteracting = false;
        this.hasBeenInteracted = false;
        
        // Enhanced properties
        this.canPickup = options.canPickup || false;
        this.itemName = options.itemName || type;
        this.description = options.description || `A ${type.toLowerCase()}`;
        this.interactionText = options.interactionText || (this.canPickup ? "Press E to take" : "Press E to use");
        this.onInteract = options.onInteract || null; // Custom interaction function
        this.glowColor = options.glowColor || '#ffff00';
        this.glowIntensity = 0;
        this.glowDirection = 1;

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

    update(deltaTime) {
        // Update glow effect when near player
        if (this.isInteracting) {
            this.glowIntensity += this.glowDirection * 0.05;
            if (this.glowIntensity >= 1) {
                this.glowIntensity = 1;
                this.glowDirection = -1;
            } else if (this.glowIntensity <= 0.3) {
                this.glowIntensity = 0.3;
                this.glowDirection = 1;
            }
        } else {
            this.glowIntensity = Math.max(0, this.glowIntensity - 0.1);
        }
    }

    interact(player) {
        if (this.hasBeenInteracted && this.canPickup) {
            return false; // Already picked up
        }

        if (this.canPickup) {
            const success = player.addToInventory({
                name: this.itemName,
                description: this.description,
                type: this.type
            });
            if (success) {
                this.hasBeenInteracted = true;
                return true;
            }
            return false; // Inventory full
        } else {
            // Custom interaction or default behavior
            if (this.onInteract) {
                this.onInteract(player, this);
            } else {
                // Default interaction behavior - silent in production
            }
            this.hasBeenInteracted = true;
            return true;
        }
    }

    draw(ctx) {
        // Don't draw if picked up
        if (this.hasBeenInteracted && this.canPickup) {
            return;
        }

        // Draw glow effect
        if (this.glowIntensity > 0) {
            ctx.save();
            ctx.shadowColor = this.glowColor;
            ctx.shadowBlur = 20 * this.glowIntensity;
            ctx.globalAlpha = 0.5 + 0.5 * this.glowIntensity;
        }

        if (this.texture && this.texture.complete) {
            // Draw with texture
            ctx.imageSmoothingEnabled = false;  // For pixel art textures
            ctx.drawImage(this.texture, this.x, this.y, this.width, this.height);
        } else if (this.color) {
            // Draw with color
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        if (this.glowIntensity > 0) {
            ctx.restore();
        }

        // Draw interaction text if needed
        if (this.isInteracting && !this.hasBeenInteracted) {
            ctx.fillStyle = 'black';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            
            const text = this.interactionText;
            const textWidth = ctx.measureText(text).width;
            const padding = 6;
            
            // Draw text background with rounded corners
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            const textX = this.x + (this.width/2) - (textWidth/2) - padding;
            const textY = this.y - 30;
            const textBoxWidth = textWidth + (padding * 2);
            const textBoxHeight = 20;
            
            ctx.beginPath();
            ctx.roundRect(textX, textY, textBoxWidth, textBoxHeight, 5);
            ctx.fill();
            
            // Draw text
            ctx.fillStyle = 'white';
            ctx.fillText(text, this.x + this.width/2, this.y - 15);
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

        // Initialize systems
        this.particleSystem = new ParticleSystem();
        this.soundManager = new SoundManager();
        this.uiManager = new UIManager(this.canvas);
        this.spriteManager = new SpriteManager();
        
        // Game timing
        this.lastTime = 0;
        this.deltaTime = 0;
        this.lowEnergyNotificationTime = 0;

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        const houseWidth = 600;
        const houseHeight = 400;
        
        const houseStartX = centerX - (houseWidth / 2);
        const houseStartY = centerY - (houseHeight / 2);

        this.player = new Player(centerX, centerY);
        
        // Set initial character
        const initialCharacter = this.spriteManager.getCurrentCharacter();
        this.player.setCharacter(initialCharacter);

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

        // Create enhanced interactive objects with pickup items and better interactions
        this.interactiveObjects = [
            // Bedroom 1
            new InteractiveObject(houseStartX + 50, houseStartY + 50, 80, 40, "Bed", "assets/bedtexture.png", {
                interactionText: "Press E to sleep",
                onInteract: (player, obj) => {
                    player.energy = player.maxEnergy;
                    this.uiManager.addNotification("You feel well rested!", 2000, '#4CAF50');
                    this.particleSystem.createExplosion(obj.x + obj.width/2, obj.y + obj.height/2, '#87CEEB', 15);
                }
            }),
            new InteractiveObject(houseStartX + 50, houseStartY + 100, 40, 40, "Dresser", "#deb887", {
                interactionText: "Press E to search",
                onInteract: (player, obj) => {
                    const items = ['Family Photo', 'Pocket Watch', 'Reading Glasses'];
                    const randomItem = items[Math.floor(Math.random() * items.length)];
                    if (player.addToInventory({name: randomItem, type: 'personal', description: `A ${randomItem.toLowerCase()} from the dresser drawer`})) {
                        this.uiManager.addNotification(`Found: ${randomItem}`, 2000, '#FFD700');
                        this.particleSystem.createPickupEffect(obj.x + obj.width/2, obj.y + obj.height/2);
                    } else {
                        this.uiManager.addNotification("Inventory full!", 2000, '#f44336');
                    }
                }
            }),
            
            // Pickup items in bedroom 1
            new InteractiveObject(houseStartX + 140, houseStartY + 60, 15, 15, "Keys", "#C0C0C0", {
                canPickup: true,
                itemName: "House Keys",
                description: "A set of house keys on a keychain",
                glowColor: '#C0C0C0'
            }),
            
            // Bedroom 2
            new InteractiveObject(houseStartX + 250, houseStartY + 50, 80, 40, "Bed", "assets/bedtexture.png", {
                interactionText: "Press E to sleep",
                onInteract: (player, obj) => {
                    player.energy = player.maxEnergy;
                    this.uiManager.addNotification("You feel well rested!", 2000, '#4CAF50');
                    this.particleSystem.createExplosion(obj.x + obj.width/2, obj.y + obj.height/2, '#87CEEB', 15);
                }
            }),
            new InteractiveObject(houseStartX + 250, houseStartY + 100, 40, 40, "Closet", "#deb887", {
                interactionText: "Press E to open",
                onInteract: (player, obj) => {
                    // Check if player has house keys
                    const hasKeys = player.inventory.find(item => item.name === "House Keys");
                    if (hasKeys) {
                        const clothes = ['Winter Coat', 'Umbrella', 'Hiking Boots'];
                        const randomItem = clothes[Math.floor(Math.random() * clothes.length)];
                        if (player.addToInventory({name: randomItem, type: 'clothing', description: `${randomItem} from the closet`})) {
                            this.uiManager.addNotification(`Found: ${randomItem}`, 2000, '#4CAF50');
                            this.particleSystem.createPickupEffect(obj.x + obj.width/2, obj.y + obj.height/2);
                            obj.hasBeenInteracted = true;
                        } else {
                            this.uiManager.addNotification("Inventory full!", 2000, '#f44336');
                        }
                    } else {
                        this.uiManager.addNotification("The closet is locked. Need keys...", 2000, '#f44336');
                    }
                }
            }),
            
            // Living Room
            new InteractiveObject(houseStartX + 450, houseStartY + 200, 100, 60, "Sofa", "#808080", {
                interactionText: "Press E to sit and rest",
                onInteract: (player, obj) => {
                    player.energy = Math.min(player.maxEnergy, player.energy + 30);
                    this.uiManager.addNotification("You sit and relax on the comfortable sofa", 2500, '#87CEEB');
                }
            }),
            new InteractiveObject(houseStartX + 450, houseStartY + 150, 40, 40, "TV", "#000000", {
                interactionText: "Press E to watch TV",
                onInteract: (player, obj) => {
                    const shows = ["Local News", "Weather Report", "Nature Documentary", "Classic Movie"];
                    const randomShow = shows[Math.floor(Math.random() * shows.length)];
                    this.uiManager.addNotification(`Now watching: ${randomShow}`, 3000, '#87CEEB');
                    player.energy = Math.min(player.maxEnergy, player.energy + 10);
                }
            }),
            
            // Kitchen
            new InteractiveObject(houseStartX + 450, houseStartY + 50, 100, 40, "Counter", "#a9a9a9", {
                interactionText: "Press E to search counter",
                onInteract: (player, obj) => {
                    const kitchenItems = ['Fresh Apple', 'Granola Bar', 'Water Bottle'];
                    const randomItem = kitchenItems[Math.floor(Math.random() * kitchenItems.length)];
                    if (player.addToInventory({name: randomItem, type: 'food', description: `${randomItem} from the kitchen counter`})) {
                        this.uiManager.addNotification(`Found: ${randomItem}`, 2000, '#4CAF50');
                        this.particleSystem.createPickupEffect(obj.x + obj.width/2, obj.y + obj.height/2);
                        player.energy = Math.min(player.maxEnergy, player.energy + 15);
                    } else {
                        this.uiManager.addNotification("Inventory full!", 2000, '#f44336');
                    }
                }
            }),
            new InteractiveObject(houseStartX + 450, houseStartY + 100, 60, 60, "Refrigerator", "#f0f0f0", {
                interactionText: "Press E to open fridge",
                onInteract: (player, obj) => {
                    const foodItems = ['Cold Milk', 'Fresh Cheese', 'Leftover Pizza', 'Orange Juice'];
                    const randomFood = foodItems[Math.floor(Math.random() * foodItems.length)];
                    if (player.addToInventory({name: randomFood, type: 'food', description: `${randomFood} from the refrigerator`})) {
                        this.uiManager.addNotification(`Took: ${randomFood}`, 2000, '#4CAF50');
                        this.particleSystem.createPickupEffect(obj.x + obj.width/2, obj.y + obj.height/2);
                        player.energy = Math.min(player.maxEnergy, player.energy + 25);
                    } else {
                        this.uiManager.addNotification("Inventory full!", 2000, '#f44336');
                    }
                }
            }),
            
            // Dining Room
            new InteractiveObject(houseStartX + 250, houseStartY + 200, 80, 80, "Dining Table", "#8b4513", {
                interactionText: "Press E to examine table",
                onInteract: (player, obj) => {
                    const tableItems = ['Newspaper', 'Coffee Mug', 'Car Keys'];
                    const randomItem = tableItems[Math.floor(Math.random() * tableItems.length)];
                    if (player.addToInventory({name: randomItem, type: 'misc', description: `${randomItem} left on the dining table`})) {
                        this.uiManager.addNotification(`Found: ${randomItem}`, 2000, '#D2B48C');
                        this.particleSystem.createPickupEffect(obj.x + obj.width/2, obj.y + obj.height/2);
                    } else {
                        this.uiManager.addNotification("Nothing useful on the table", 2000, '#999999');
                    }
                }
            }),
            
            // Realistic pickup items scattered around
            new InteractiveObject(houseStartX + 330, houseStartY + 140, 12, 12, "Wallet", "#8B4513", {
                canPickup: true,
                itemName: "Leather Wallet",
                description: "A brown leather wallet with some cash inside",
                glowColor: '#8B4513'
            }),
            new InteractiveObject(houseStartX + 180, houseStartY + 250, 18, 18, "Book", "#4B0082", {
                canPickup: true,
                itemName: "Recipe Book",
                description: "A well-used cookbook with family recipes",
                glowColor: '#4B0082'
            }),
            new InteractiveObject(houseStartX + 530, houseStartY + 280, 14, 14, "Phone", "#1a1a1a", {
                canPickup: true,
                itemName: "Mobile Phone",
                description: "A smartphone that still has some battery",
                glowColor: '#00BFFF'
            })
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
        this.floorTexture.src = 'assets/housefloor.jpg';
        this.floorTexture.onerror = () => {
            // Floor texture failed to load, using solid color fallback
            this.floorTexture = null;
        };

        // Enhanced input handling
        this.keys = {};
        this.keyHandler = (e) => {
            this.keys[e.key] = e.type === 'keydown';
        };
        
        window.addEventListener('keydown', this.keyHandler);
        window.addEventListener('keyup', this.keyHandler);

        // Initialize welcome message
        this.uiManager.addNotification("Welcome to Life Unscripted!", 3000, '#4CAF50');
        this.uiManager.addNotification("Press C to choose your character", 4000, '#87CEEB');
        this.uiManager.addNotification("Hold Shift while moving to sprint", 4000, '#ff9800');

        // Start game loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    destroy() {
        // Clean up event listeners when returning to menu
        window.removeEventListener('keydown', this.keyHandler);
        window.removeEventListener('keyup', this.keyHandler);
    }

    handleInteraction() {
        if (!this.player.canInteract()) return;

        let interacted = false;

        // Check for object interaction
        for (let obj of this.interactiveObjects) {
            if (this.isPlayerNear(obj) && !obj.hasBeenInteracted) {
                if (this.player.interact()) {
                    const success = obj.interact(this.player);
                    if (success) {
                        // Create interaction particle effect
                        this.particleSystem.createExplosion(
                            obj.x + obj.width/2, 
                            obj.y + obj.height/2, 
                            obj.canPickup ? '#00ff00' : '#87CEEB', 
                            8
                        );
                        
                        // Play interaction sound (if available)
                        this.soundManager.playSound('interact');
                        
                        interacted = true;
                        
                        // Special effects for pickups
                        if (obj.canPickup) {
                            this.particleSystem.createPickupEffect(
                                obj.x + obj.width/2, 
                                obj.y + obj.height/2
                            );
                        }
                    }
                }
                break; // Only interact with one object at a time
            }
        }

        if (!interacted) {
            // No interaction available
            this.uiManager.addNotification("Nothing to interact with here", 1500, '#999999');
        }
    }

    update(currentTime) {
        // Calculate delta time
        if (this.lastTime === 0) this.lastTime = currentTime;
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Handle player movement
        let dx = 0;
        let dy = 0;
        let isSprinting = false;

        if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) dy = -1;
        if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) dy = 1;
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) dx = -1;
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) dx = 1;

        // Check for sprint key (Shift)
        if (this.keys['Shift']) {
            if (this.player.energy > 10 && (dx !== 0 || dy !== 0)) {
                isSprinting = true;
            } else if ((dx !== 0 || dy !== 0) && this.player.energy <= 10) {
                // Show low energy notification occasionally
                if (!this.lowEnergyNotificationTime || currentTime - this.lowEnergyNotificationTime > 3000) {
                    this.uiManager.addNotification("Too tired to sprint! Rest to recover energy", 2000, '#f44336');
                    this.lowEnergyNotificationTime = currentTime;
                }
            }
        }

        // Update player with sprint state
        this.player.update(this.deltaTime, isSprinting);

        // Apply movement
        this.player.move(dx, dy, this.walls, []);

        // Create sprint dust particles
        if (this.player.isSprinting && this.player.isMoving && Math.random() < 0.4) {
            const dustX = this.player.x + this.player.width/2 + (Math.random() - 0.5) * 20;
            const dustY = this.player.y + this.player.height + (Math.random() - 0.5) * 10;
            this.particleSystem.addParticle(
                dustX, dustY, 
                (Math.random() - 0.5) * 2, 
                Math.random() * 2 + 1, 
                '#D2B48C', 
                15 + Math.random() * 10, 
                1 + Math.random()
            );
        }

        // Update systems
        this.particleSystem.update();
        this.uiManager.update(this.deltaTime);
        this.spriteManager.update(this.deltaTime);

        // Update interactive objects
        this.interactiveObjects.forEach(obj => {
            if (obj.update) obj.update(this.deltaTime);
        });

        // Check for interactions
        for (let obj of this.interactiveObjects) {
            obj.isInteracting = this.isPlayerNear(obj) && !obj.hasBeenInteracted;
        }

        // Handle character selection menu
        if (this.keys['c'] || this.keys['C']) {
            this.spriteManager.toggleMenu();
            this.keys['c'] = false;
            this.keys['C'] = false;
        }

        // Handle character selection (1-4 keys)
        if (this.keys['1']) {
            const character = this.spriteManager.selectCharacter(0);
            if (character) {
                this.player.setCharacter(character);
                this.uiManager.addNotification(`Now playing as ${character.displayName}!`, 2000, '#4CAF50');
            }
            this.keys['1'] = false;
        }
        if (this.keys['2']) {
            const character = this.spriteManager.selectCharacter(1);
            if (character) {
                this.player.setCharacter(character);
                this.uiManager.addNotification(`Now playing as ${character.displayName}!`, 2000, '#4CAF50');
            }
            this.keys['2'] = false;
        }
        if (this.keys['3']) {
            const character = this.spriteManager.selectCharacter(2);
            if (character) {
                this.player.setCharacter(character);
                this.uiManager.addNotification(`Now playing as ${character.displayName}!`, 2000, '#4CAF50');
            }
            this.keys['3'] = false;
        }
        if (this.keys['4']) {
            const character = this.spriteManager.selectCharacter(3);
            if (character) {
                this.player.setCharacter(character);
                this.uiManager.addNotification(`Now playing as ${character.displayName}!`, 2000, '#4CAF50');
            }
            this.keys['4'] = false;
        }

        // Handle interaction key
        if (this.keys['e'] || this.keys['E']) {
            this.handleInteraction();
            // Prevent key repeat
            this.keys['e'] = false;
            this.keys['E'] = false;
        }

        // Handle inventory toggle
        if (this.keys['i'] || this.keys['I']) {
            this.uiManager.toggleInventory();
            this.keys['i'] = false;
            this.keys['I'] = false;
        }

        // Handle light toggle
        if (this.keys['l'] || this.keys['L']) {
            this.player.toggleLight();
            this.uiManager.addNotification(
                this.player.lightsOn ? "Lights ON" : "Lights OFF", 
                1500, 
                this.player.lightsOn ? '#FFD700' : '#666666'
            );
            this.keys['l'] = false;
            this.keys['L'] = false;
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
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Save context for lighting effects
        this.ctx.save();

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

        // Draw particles
        this.particleSystem.draw(this.ctx);

        // Draw player
        this.player.draw(this.ctx);

        // Apply lighting effect
        if (!this.player.lightsOn) {
            this.drawDarkness();
        }

        this.ctx.restore();

        // Draw UI (always on top)
        this.uiManager.draw(this.ctx, this.player, this.spriteManager);
        
        // Draw character selection menu (on top of everything)
        this.spriteManager.drawCharacterMenu(this.ctx, this.canvas);
    }

    drawDarkness() {
        // Create darkness overlay with light around player
        this.ctx.save();
        
        // Create radial gradient for light effect
        const gradient = this.ctx.createRadialGradient(
            this.player.x + this.player.width/2, 
            this.player.y + this.player.height/2, 
            0,
            this.player.x + this.player.width/2, 
            this.player.y + this.player.height/2, 
            this.player.lightRadius
        );
        
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');

        // Draw darkness overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Cut out light area using composite operation
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.restore();
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
        if (this.floorTexture && this.floorTexture.complete && this.floorTexture.width > 0) {
            try {
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
            } catch (error) {
                // Failed to create floor pattern, using solid color
                this.drawSolidFloor();
            }
        } else {
            // Fallback to solid color floor
            this.drawSolidFloor();
        }
    }

    drawSolidFloor() {
        // Draw house floor with solid color fallback
        this.ctx.fillStyle = '#DEB887'; // Burlywood color for floor
        this.ctx.fillRect(
            this.houseBounds.x,
            this.houseBounds.y,
            this.houseBounds.width,
            this.houseBounds.height
        );
    }

    gameLoop(currentTime) {
        this.update(currentTime);
        this.draw();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Remove the automatic game creation
// The game will now be created when the Play button is clicked 

// Particle System
class Particle {
    constructor(x, y, vx, vy, color, life, size = 2) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.gravity = 0.1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life--;
        
        // Fade out over time
        this.vx *= 0.98;
        this.vy *= 0.98;
    }

    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    addParticle(x, y, vx, vy, color, life, size) {
        this.particles.push(new Particle(x, y, vx, vy, color, life, size));
    }

    createExplosion(x, y, color = '#ffaa00', count = 10) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 2 + Math.random() * 3;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            this.addParticle(x, y, vx, vy, color, 30 + Math.random() * 20, 2 + Math.random() * 2);
        }
    }

    createPickupEffect(x, y) {
        for (let i = 0; i < 6; i++) {
            const vx = (Math.random() - 0.5) * 4;
            const vy = -Math.random() * 3 - 1;
            this.addParticle(x, y, vx, vy, '#00ff00', 40, 3);
        }
    }

    update() {
        this.particles = this.particles.filter(particle => {
            particle.update();
            return !particle.isDead();
        });
    }

    draw(ctx) {
        this.particles.forEach(particle => particle.draw(ctx));
    }
}

// Sound Manager
class SoundManager {
    constructor() {
        this.sounds = {};
        this.volume = 0.5;
        this.musicVolume = 0.3;
        this.enabled = true;
    }

    loadSound(name, url) {
        const audio = new Audio();
        audio.src = url;
        audio.volume = this.volume;
        this.sounds[name] = audio;
    }

    playSound(name) {
        if (!this.enabled || !this.sounds[name]) return;
        
        try {
            const sound = this.sounds[name].cloneNode();
            sound.volume = this.volume;
            sound.play();
        } catch (e) {
            // Sound playback failed - continue silently
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        Object.values(this.sounds).forEach(sound => {
            sound.volume = this.volume;
        });
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

// UI Manager
class UIManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.showInventory = false;
        this.showStats = true;
        this.inventoryAnimation = 0;
        this.notifications = [];
    }

    addNotification(text, duration = 3000, color = '#ffffff') {
        this.notifications.push({
            text,
            duration,
            color,
            timeLeft: duration,
            alpha: 1,
            y: 50
        });
    }

    update(deltaTime) {
        // Update inventory animation
        if (this.showInventory) {
            this.inventoryAnimation = Math.min(1, this.inventoryAnimation + 0.1);
        } else {
            this.inventoryAnimation = Math.max(0, this.inventoryAnimation - 0.1);
        }

        // Update notifications
        this.notifications = this.notifications.filter(notification => {
            notification.timeLeft -= deltaTime;
            if (notification.timeLeft <= 0) {
                notification.alpha = Math.max(0, notification.alpha - 0.05);
                return notification.alpha > 0;
            }
            return true;
        });

        // Animate notification positions
        this.notifications.forEach((notification, index) => {
            const targetY = 50 + index * 30;
            notification.y += (targetY - notification.y) * 0.1;
        });
    }

    drawPlayerStats(ctx, player) {
        if (!this.showStats) return;

        ctx.save();
        
        // Energy bar
        const barWidth = 180;
        const barHeight = 18;
        const barX = 20;
        const barY = this.canvas.height - 90;

        // Background panel
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(barX - 8, barY - 8, barWidth + 16, barHeight + 50);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX - 8, barY - 8, barWidth + 16, barHeight + 50);

        // Energy bar background
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Energy bar fill
        const energyPercent = player.energy / player.maxEnergy;
        let energyColor = '#4CAF50';
        if (energyPercent <= 0.2) energyColor = '#f44336';
        else if (energyPercent <= 0.5) energyColor = '#ff9800';
        
        ctx.fillStyle = energyColor;
        ctx.fillRect(barX, barY, barWidth * energyPercent, barHeight);

        // Energy bar border
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Energy text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(`Energy: ${Math.floor(player.energy)}/${player.maxEnergy}`, barX, barY + 32);

        // Movement status
        ctx.font = '11px Arial';
        if (player.isSprinting) {
            ctx.fillStyle = '#ff6b6b';
            ctx.fillText('🏃 SPRINTING', barX, barY + 45);
        } else if (player.isMoving) {
            ctx.fillStyle = '#4ecdc4';
            ctx.fillText('🚶 Walking', barX, barY + 45);
        } else {
            ctx.fillStyle = '#95a5a6';
            ctx.fillText('⏸ Resting', barX, barY + 45);
        }

        // Low energy warning
        if (energyPercent <= 0.1) {
            ctx.fillStyle = '#f44336';
            ctx.font = 'bold 10px Arial';
            ctx.fillText('⚠ LOW ENERGY', barX + 90, barY + 45);
        }

        ctx.restore();
    }

    drawInventory(ctx, player) {
        if (this.inventoryAnimation === 0) return;

        ctx.save();
        ctx.globalAlpha = this.inventoryAnimation;

        const invWidth = 300;
        const invHeight = 400;
        const invX = this.canvas.width - invWidth - 20;
        const invY = 50;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(invX, invY, invWidth, invHeight);

        // Border
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        ctx.strokeRect(invX, invY, invWidth, invHeight);

        // Title
        ctx.fillStyle = 'white';
        ctx.font = 'bold 18px Arial';
        ctx.fillText('Inventory', invX + 10, invY + 25);

        // Items
        ctx.font = '14px Arial';
        const itemsPerRow = 3;
        const itemSize = 60;
        const padding = 10;

        player.inventory.forEach((item, index) => {
            const row = Math.floor(index / itemsPerRow);
            const col = index % itemsPerRow;
            const itemX = invX + padding + col * (itemSize + padding);
            const itemY = invY + 40 + row * (itemSize + padding);

            // Item slot background
            ctx.fillStyle = '#333';
            ctx.fillRect(itemX, itemY, itemSize, itemSize);

            // Item border
            ctx.strokeStyle = '#666';
            ctx.strokeRect(itemX, itemY, itemSize, itemSize);

            // Item name (simplified representation)
            ctx.fillStyle = 'white';
            ctx.font = '10px Arial';
            ctx.fillText(item.name.substring(0, 8), itemX + 2, itemY + 15);
        });

        // Inventory count
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(`${player.inventory.length}/${player.maxInventorySize}`, invX + 10, invY + invHeight - 10);

        ctx.restore();
    }

    drawNotifications(ctx) {
        this.notifications.forEach((notification, index) => {
            ctx.save();
            ctx.globalAlpha = notification.alpha;
            
            // Calculate dimensions
            ctx.font = 'bold 14px Arial';
            const textWidth = ctx.measureText(notification.text).width;
            const padding = 16;
            const notificationWidth = Math.max(200, textWidth + padding * 2);
            const notificationHeight = 35;
            const x = (this.canvas.width - notificationWidth) / 2;
            const y = notification.y;
            
            // Determine notification style based on color
            let borderColor = '#4CAF50'; // Default green
            let bgColor = 'rgba(0, 0, 0, 0.9)';
            let iconColor = '#4CAF50';
            let icon = '✓';
            
            // Color-based styling
            if (notification.color === '#f44336') { // Error/warning red
                borderColor = '#f44336';
                iconColor = '#f44336';
                icon = '⚠';
            } else if (notification.color === '#ff9800') { // Warning orange
                borderColor = '#ff9800';
                iconColor = '#ff9800';
                icon = '⚡';
            } else if (notification.color === '#87CEEB') { // Info blue
                borderColor = '#87CEEB';
                iconColor = '#87CEEB';
                icon = 'ℹ';
            } else if (notification.color === '#FFD700') { // Special gold
                borderColor = '#FFD700';
                iconColor = '#FFD700';
                icon = '★';
            } else if (notification.color === '#999999') { // Neutral gray
                borderColor = '#666';
                iconColor = '#999';
                icon = '○';
            }
            
            // Draw background with rounded corners
            ctx.fillStyle = bgColor;
            ctx.beginPath();
            ctx.roundRect(x, y - notificationHeight/2, notificationWidth, notificationHeight, 8);
            ctx.fill();
            
            // Draw border
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(x, y - notificationHeight/2, notificationWidth, notificationHeight, 8);
            ctx.stroke();
            
            // Draw subtle inner glow
            ctx.shadowColor = borderColor;
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 1;
            ctx.globalAlpha = notification.alpha * 0.3;
            ctx.beginPath();
            ctx.roundRect(x + 2, y - notificationHeight/2 + 2, notificationWidth - 4, notificationHeight - 4, 6);
            ctx.stroke();
            
            // Reset shadow
            ctx.shadowBlur = 0;
            ctx.globalAlpha = notification.alpha;
            
            // Draw icon
            ctx.fillStyle = iconColor;
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(icon, x + 12, y + 6);
            
            // Draw text
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(notification.text, x + notificationWidth/2, y + 5);
            
            // Draw subtle progress bar for timed notifications
            if (notification.duration > 0) {
                const progress = notification.timeLeft / notification.duration;
                const progressWidth = (notificationWidth - 8) * progress;
                
                ctx.fillStyle = borderColor;
                ctx.globalAlpha = notification.alpha * 0.6;
                ctx.beginPath();
                ctx.roundRect(x + 4, y + notificationHeight/2 - 6, progressWidth, 2, 1);
                ctx.fill();
            }
            
            ctx.restore();
        });
    }

    drawCharacterInfo(ctx, spriteManager) {
        const character = spriteManager.getCurrentCharacter();
        if (!character) return;

        ctx.save();
        
        // Calculate dimensions
        ctx.font = 'bold 12px Arial';
        const text = `Playing as: ${character.displayName}`;
        const textWidth = ctx.measureText(text).width;
        const padding = 12;
        const boxWidth = textWidth + padding * 2;
        const boxHeight = 25;
        const bgX = this.canvas.width - boxWidth - 15;
        const bgY = this.canvas.height - boxHeight - 15;
        
        // Draw background with rounded corners
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.beginPath();
        ctx.roundRect(bgX, bgY, boxWidth, boxHeight, 6);
        ctx.fill();
        
        // Draw border
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(bgX, bgY, boxWidth, boxHeight, 6);
        ctx.stroke();
        
        // Draw subtle inner glow
        ctx.shadowColor = '#4CAF50';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.roundRect(bgX + 2, bgY + 2, boxWidth - 4, boxHeight - 4, 4);
        ctx.stroke();
        
        // Reset shadow and opacity
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        
        // Draw character icon
        ctx.fillStyle = '#4CAF50';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('👤', bgX + 8, bgY + 17);
        
        // Draw character name
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(text, bgX + 25, bgY + 16);
        
        ctx.restore();
    }

    toggleInventory() {
        this.showInventory = !this.showInventory;
    }

    draw(ctx, player, spriteManager) {
        this.drawPlayerStats(ctx, player);
        this.drawInventory(ctx, player);
        this.drawNotifications(ctx);
        
        // Draw current character name
        if (spriteManager) {
            this.drawCharacterInfo(ctx, spriteManager);
        }
    }
}

// Sprite Management System
class SpriteManager {
    constructor() {
        this.availableCharacters = [
            {
                name: "Jake",
                displayName: "Jake",
                useIndividualFrames: true,
                frameFiles: {
                    idle: "JakeIdle.png",
                    walk: "JakeWalk.png"
                },
                frameWidth: 64,  // 256 ÷ 4 frames = 64 pixels per frame
                frameHeight: 64, // 64 ÷ 1 frame = 64 pixels per frame
                scale: 0.5       // Scale down from 64x64 to 32x32 for display
            }
        ];
        
        this.currentCharacterIndex = 0;
        this.showCharacterMenu = false;
        this.menuAnimation = 0;
    }

    getCurrentCharacter() {
        return this.availableCharacters[this.currentCharacterIndex];
    }

    nextCharacter() {
        this.currentCharacterIndex = (this.currentCharacterIndex + 1) % this.availableCharacters.length;
        return this.getCurrentCharacter();
    }

    previousCharacter() {
        this.currentCharacterIndex = (this.currentCharacterIndex - 1 + this.availableCharacters.length) % this.availableCharacters.length;
        return this.getCurrentCharacter();
    }

    selectCharacter(index) {
        if (index >= 0 && index < this.availableCharacters.length) {
            this.currentCharacterIndex = index;
            return this.getCurrentCharacter();
        }
        return null;
    }

    toggleMenu() {
        this.showCharacterMenu = !this.showCharacterMenu;
    }

    update(deltaTime) {
        // Animate menu
        if (this.showCharacterMenu) {
            this.menuAnimation = Math.min(1, this.menuAnimation + 0.15);
        } else {
            this.menuAnimation = Math.max(0, this.menuAnimation - 0.15);
        }
    }

    drawCharacterMenu(ctx, canvas) {
        if (this.menuAnimation === 0) return;

        ctx.save();
        ctx.globalAlpha = this.menuAnimation;

        const menuWidth = 400; // Reduced width for 2x2 layout
        const menuHeight = 250;
        const menuX = (canvas.width - menuWidth) / 2;
        const menuY = (canvas.height - menuHeight) / 2;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(menuX, menuY, menuWidth, menuHeight);

        // Border
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 3;
        ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);

        // Title
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Choose Your Character', menuX + menuWidth/2, menuY + 30);

        // Character options - 2 columns, 2 rows
        const cols = 2;
        const rows = 2;
        const charWidth = 150; // Increased width for better spacing
        const charHeight = 80;
        const startX = menuX + 50; // Centered for 2x2 layout
        const startY = menuY + 50;

        this.availableCharacters.forEach((character, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = startX + col * 150; // Better spacing for 2x2
            const y = startY + row * 90;

            // Character slot background
            if (index === this.currentCharacterIndex) {
                ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
                ctx.fillRect(x - 5, y - 5, charWidth + 10, charHeight + 10);
                ctx.strokeStyle = '#4CAF50';
                ctx.lineWidth = 2;
                ctx.strokeRect(x - 5, y - 5, charWidth + 10, charHeight + 10);
            }

            // Character name
            ctx.fillStyle = index === this.currentCharacterIndex ? '#4CAF50' : 'white';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(character.displayName, x + charWidth/2, y + charHeight - 5);

            // Number indicator
            ctx.fillStyle = '#999';
            ctx.font = '12px Arial';
            ctx.fillText(`${index + 1}`, x + charWidth/2, y + 15);
        });

        // Instructions
        ctx.fillStyle = '#ccc';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Press 1-4 to select character, C to close menu', menuX + menuWidth/2, menuY + menuHeight - 15);

        ctx.restore();
    }
} 