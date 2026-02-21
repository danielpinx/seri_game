import pygame
from simulation import Simulation
#from grid import Grid
#from particle import SandParticle

pygame.init()
pygame.mouse.set_visible(False)

WINDOW_WIDTH = 800
WINDOW_HEIGHT = 600
CELL_SIZE = 10
FPS = 120
GREY = (29, 29, 29)

window = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
pygame.display.set_caption("Falling Sand")

clock = pygame.time.Clock()
simulation = Simulation(WINDOW_WIDTH, WINDOW_HEIGHT, CELL_SIZE)

#simulation.add_particle(0, 0)
#simulation.add_particle(1, 1)
#simulation.remove_particle(0, 0)

#grid = Grid(WINDOW_WIDTH, WINDOW_HEIGHT, CELL_SIZE)
#grid.cells[0][0] = SandParticle()
#grid.cells[2][1] = SandParticle()

# Simulation Loop
while True:

    # 1. Event Handling
    simulation.handle_controls()
    #for event in pygame.event.get():
        #if event.type == pygame.QUIT:
            #pygame.quit()
            #sys.exit()

        #if event.type == pygame.KEYDOWN:

    # 2. Updating State
    simulation.update()

    # 3. Drawing
    window.fill(GREY)
    simulation.draw(window)

    #grid.draw(window)
            
    pygame.display.flip()
    clock.tick(FPS)
