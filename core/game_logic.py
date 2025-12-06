import math
import random

class Config:
    BASE_SPEED = 3.5
    SPRINT_SPEED = 6.5
    TURN_SPEED = 0.12
    SEGMENT_DIST = 10
    START_LENGTH = 15
    GROWTH_PER_FOOD = 5
    WALLS_ENABLED = True

class Vector:
    def __init__(self, x, y):
        self.x = x
        self.y = y

class Snake:
    def __init__(self, id, start_x, start_y):
        self.id = id
        self.alive = True
        self.score = 0
        self.angle = math.pi  # Default facing left
        self.head = Vector(start_x, start_y)
        self.segments = []
        
        # Initialize segments
        dir_x = math.cos(self.angle + math.pi)
        dir_y = math.sin(self.angle + math.pi)
        
        for i in range(1, Config.START_LENGTH + 1):
            self.segments.append(Vector(
                start_x + dir_x * i * Config.SEGMENT_DIST,
                start_y + dir_y * i * Config.SEGMENT_DIST
            ))

    def move(self, dt):
        # Simplified movement logic for server-side validation
        move_dist = Config.BASE_SPEED * (dt / (1000 / 60))
        self.head.x += math.cos(self.angle) * move_dist
        self.head.y += math.sin(self.angle) * move_dist

    def check_collision(self, width, height):
        if Config.WALLS_ENABLED:
            if (self.head.x < 0 or self.head.x > width or 
                self.head.y < 0 or self.head.y > height):
                self.alive = False
                return True
        return False

class GameState:
    def __init__(self, width=800, height=600):
        self.width = width
        self.height = height
        self.snakes = []
        self.food = None
    
    def add_snake(self, id):
        snake = Snake(id, self.width * 0.75, self.height / 2)
        self.snakes.append(snake)
        return snake

    def spawn_food(self):
        margin = 50
        self.food = Vector(
            random.uniform(margin, self.width - margin),
            random.uniform(margin, self.height - margin)
        )
