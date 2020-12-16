const TILE_SIZE = 48;
const MAP_NUM_ROWS = 11;
const MAP_NUM_COLS = 15;

const WINDOW_WIDTH = MAP_NUM_COLS * TILE_SIZE;
const WINDOW_HEIGHT = MAP_NUM_ROWS * TILE_SIZE;

const FOV_ANGLE = 60 * (Math.PI / 180);
const WALL_STRIP_WIDTH = 1;
const NUM_RAYS = WINDOW_WIDTH / WALL_STRIP_WIDTH;

const MINIMAP_SCALE_FACTOR = 0.25;

class Map {
    constructor() {
        this.grid = [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
            [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
            [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ];
    }

    hasWallAt(x, y) {
        if (x < 0 || x >= WINDOW_WIDTH || y < 0 || y >= WINDOW_HEIGHT) return true;
        const col = Math.floor(x / TILE_SIZE);
        const row = Math.floor(y / TILE_SIZE);
        return this.grid[row][col] != 0;
    }

    render() {
        for (var i = 0; i < MAP_NUM_ROWS; i++) {
            for (var j = 0; j < MAP_NUM_COLS; j++) {
                var tileX = j * TILE_SIZE;
                var tileY = i * TILE_SIZE;
                var tileColor = this.grid[i][j] == 1 ? "#555" : "#ddd";
                stroke("#aaa");
                fill(tileColor);
                rect(
                    MINIMAP_SCALE_FACTOR * tileX,
                    MINIMAP_SCALE_FACTOR * tileY,
                    MINIMAP_SCALE_FACTOR * TILE_SIZE,
                    MINIMAP_SCALE_FACTOR * TILE_SIZE
                );
            }
        }
    }
}

class Player {
    constructor() {
        this.x = WINDOW_WIDTH / 2;
        this.y = WINDOW_HEIGHT / 2;
        this.radius = 3;
        this.turnDirection = 0; // -1 if left, +1 is right
        this.walkDirection = 0; // -1 if back, +1 if right
        this.rotationAngle = Math.PI / 2;
        this.moveSpeed = 3.0;
        this.rotationSpeed = 2 * (Math.PI / 180);
    }

    update() {
        this.rotationAngle += this.turnDirection * this.rotationSpeed;
        const moveStep = this.walkDirection * this.moveSpeed;
        const nextX = this.x + moveStep * Math.cos(this.rotationAngle);
        const nextY = this.y + moveStep * Math.sin(this.rotationAngle);

        if (!grid.hasWallAt(nextX, nextY)) {
            this.x = nextX;
            this.y = nextY;
        }
    }

    render() {
        noStroke();
        fill("red");
        circle(
            MINIMAP_SCALE_FACTOR * this.x,
            MINIMAP_SCALE_FACTOR * this.y,
            MINIMAP_SCALE_FACTOR * this.radius
        );
        stroke("blue");
        line(
            MINIMAP_SCALE_FACTOR * this.x,
            MINIMAP_SCALE_FACTOR * this.y,
            MINIMAP_SCALE_FACTOR * (this.x + Math.cos(this.rotationAngle) * 30),
            MINIMAP_SCALE_FACTOR * (this.y + Math.sin(this.rotationAngle) * 30)
        );
    }
}

class Ray {
    constructor(rayAngle) {
        this.rayAngle = normalizeAngle(rayAngle);
        this.wallHitX = 0;
        this.wallHitY = 0;
        this.distance = 0;
        this.wasHitVertical = false;

        this.isRayFacingDown = this.rayAngle > 0 && this.rayAngle < Math.PI;
        this.isRayFacingUp = !this.isRayFacingDown;

        this.isRayFacingRight = this.rayAngle < Math.PI / 2 || this.rayAngle > 1.5 * Math.PI;
        this.isRayFacingLeft = !this.isRayFacingRight;
    }

    cast() {
        let xIntercept, yIntercept;
        let xStep, yStep;
        ///////////////////////////////////////////
        // HORIZONTAL RAY-GRID INTERSECTION CODE
        //////////////////////////////////////////
        let foundHorzWallHit = false;
        let horzWallHitX = 0;
        let horzWallHitY = 0;

        // Find the y-coordinate of the closest horizontal grid intersection 
        yIntercept = Math.floor(player.y / TILE_SIZE) * TILE_SIZE;
        yIntercept += this.isRayFacingDown ? TILE_SIZE : 0;

        // Find the x-coordinate of the closest horizontal grid intersection
        xIntercept = player.x + (yIntercept - player.y) / Math.tan(this.rayAngle);

        //Calculate the increment xStep and yStep
        yStep = TILE_SIZE;
        yStep *= this.isRayFacingUp ? -1 : 1;
        // TODO: Use yStep instead of TILE_SIZE
        xStep = TILE_SIZE / Math.tan(this.rayAngle);
        xStep *= (this.isRayFacingLeft && xStep > 0) ? -1 : 1;
        xStep *= (this.isRayFacingRight && xStep < 0) ? -1 : 1;

        let nextHorzTouchX = xIntercept;
        let nextHorzTouchY = yIntercept;

        // Increment xStep and yStep until we find a wall
        while (nextHorzTouchX >= 0 && nextHorzTouchX <= WINDOW_WIDTH && nextHorzTouchY >= 0 && nextHorzTouchY <= WINDOW_HEIGHT) {
            if (grid.hasWallAt(nextHorzTouchX, nextHorzTouchY - (this.isRayFacingUp ? 1 : 0))) {
                foundHorzWallHit = true;
                horzWallHitX = nextHorzTouchX;
                horzWallHitY = nextHorzTouchY;
                break;
            } else {
                nextHorzTouchX += xStep;
                nextHorzTouchY += yStep;
            }
        }

        ///////////////////////////////////////////
        // VERTICAL RAY-GRID INTERSECTION CODE
        //////////////////////////////////////////
        let foundVertWallHit = false;
        let vertWallHitX = 0;
        let vertWallHitY = 0;

        // Find the x-coordinate of the closest vertical grid intersection 
        xIntercept = Math.floor(player.x / TILE_SIZE) * TILE_SIZE;
        xIntercept += this.isRayFacingRight ? TILE_SIZE : 0;

        // Find the y-coordinate of the closest vertical grid intersection
        yIntercept = player.y + (xIntercept - player.x) * Math.tan(this.rayAngle);

        //Calculate the increment xStep and yStep
        xStep = TILE_SIZE;
        xStep *= this.isRayFacingLeft ? -1 : 1;
        // TODO: Use yStep instead of TILE_SIZE
        yStep = TILE_SIZE * Math.tan(this.rayAngle);
        yStep *= (this.isRayFacingUp && yStep > 0) ? -1 : 1;
        yStep *= (this.isRayFacingDown && yStep < 0) ? -1 : 1;

        let nextVertTouchX = xIntercept;
        let nextVertTouchY = yIntercept;

        // Increment xStep and yStep until we find a wall
        while (nextVertTouchX >= 0 && nextVertTouchX <= WINDOW_WIDTH && nextVertTouchY >= 0 && nextVertTouchY <= WINDOW_HEIGHT) {
            if (grid.hasWallAt(nextVertTouchX - (this.isRayFacingLeft ? 1 : 0), nextVertTouchY)) {
                foundVertWallHit = true;
                vertWallHitX = nextVertTouchX;
                vertWallHitY = nextVertTouchY;
                break;
            } else {
                nextVertTouchX += xStep;
                nextVertTouchY += yStep;
            }
        }

        // Calculate both horizontal and vertical distances and choose the smallest value
        let horzHitDistance = (foundHorzWallHit) ? distanceBetweenPoints(player.x, player.y, horzWallHitX, horzWallHitY) : Number.MAX_VALUE;
        let vertHitDistance = (foundVertWallHit) ? distanceBetweenPoints(player.x, player.y, vertWallHitX, vertWallHitY) : Number.MAX_VALUE;

        if (vertHitDistance < horzHitDistance) {
            this.wallHitX = vertWallHitX;
            this.wallHitY = vertWallHitY;
            this.distance = vertHitDistance;
            this.wasHitVertical = true;
        } else {
            this.wallHitX = horzWallHitX;
            this.wallHitY = horzWallHitY;
            this.distance = horzHitDistance;
            this.wasHitVertical = false;
        }
    }

    render() {
        stroke("rgba(255,0, 0, 0.1)");
        stroke("rgba(255,0, 0, 0.1)");
        line(
            MINIMAP_SCALE_FACTOR * player.x,
            MINIMAP_SCALE_FACTOR * player.y,
            MINIMAP_SCALE_FACTOR * this.wallHitX,
            MINIMAP_SCALE_FACTOR * this.wallHitY
        );
    }
}

function render3DProjectedWalls() {
    // Loop every ray in the array of rays
    for (let i = 0; i < NUM_RAYS; i++) {
        const ray = rays[i];

        const correctWallDistance = ray.distance * Math.cos(ray.rayAngle - player.rotationAngle);

        // Calculate the distance to the projection plane
        const distanceProjectionPlane = (WINDOW_WIDTH / 2) / Math.tan(FOV_ANGLE / 2);

        // Projected wall height
        let wallStripHeight = (TILE_SIZE / correctWallDistance) * distanceProjectionPlane;

        // const alpha = 150 / correctWallDistance;
        // const color = ray.wasHitVertical ? 180 : 150;
        //fill(`rgba(${color}, ${color}, ${color}, 255)`);
        // const wallColor = ray.wasHitVertical ? "#F6DDA2" : "#F4D58D";
        const wallColor = ray.wasHitVertical ? "#F1CB72" : "#F4D58D";
        fill(wallColor);
        noStroke();
        rect(
            i * WALL_STRIP_WIDTH,
            (WINDOW_HEIGHT / 2) - (wallStripHeight / 2),
            WALL_STRIP_WIDTH,
            wallStripHeight
        )
    }
}

function normalizeAngle(angle) {
    angle = angle % (2 * Math.PI);
    if (angle < 0) {
        angle = (2 * Math.PI) + angle;
    }
    return angle;
}

function distanceBetweenPoints(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

var grid = new Map();
var player = new Player();
var rays = [];

function keyPressed() {
    if (keyCode == UP_ARROW) {
        player.walkDirection = 1;
        console.log("Key pressed: UP_ARROW")
    } else if (keyCode == DOWN_ARROW) {
        player.walkDirection = -1;
    } else if (keyCode == RIGHT_ARROW) {
        player.turnDirection = 1;
    } else if (keyCode == LEFT_ARROW) {
        player.turnDirection = -1;
    }
}

function keyReleased() {
    if (keyCode == UP_ARROW) {
        player.walkDirection = 0;
    } else if (keyCode == DOWN_ARROW) {
        player.walkDirection = 0;
    } else if (keyCode == RIGHT_ARROW) {
        player.turnDirection = 0;
    } else if (keyCode == LEFT_ARROW) {
        player.turnDirection = 0;
    }
}

function castAllRays() {
    // Start first ray subtracting half of the FOV
    var rayAngle = player.rotationAngle - (FOV_ANGLE / 2);

    rays = [];

    // loop all columns casting the rays
    for (let col = 0; col < NUM_RAYS; col++) {
        let ray = new Ray(rayAngle);
        ray.cast()
        rays.push(ray);
        rayAngle += FOV_ANGLE / NUM_RAYS;
    }
}

function setup() {
    createCanvas(WINDOW_WIDTH, WINDOW_HEIGHT);
}

function update() {
    player.update();
    castAllRays();
}

function draw() {
    clear();
    update();

    // Draw sky
    fill("#EAFDF8");
    noStroke();
    rect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT / 2);

    render3DProjectedWalls();
    grid.render();
    for (ray of rays) {
        ray.render();
    }
    player.render();
}
