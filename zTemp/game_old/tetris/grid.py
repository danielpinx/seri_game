import pygame # Day1
from colors import Colors

class Grid: # Day1
   def __init__(self):
      self.num_rows = 20
      self.num_cols = 10
      self.cell_size = 30
      self.grid = [[0 for j in range(self.num_cols)]for i in range(self.num_rows)] # Day1
      self.colors = Colors.get_cell_colors()


   def print_grid(self): # Day1
      for row in range(self.num_rows):
         for column in range(self.num_cols):
            print(self.grid[row][column], end = " ")
         print() # Day1

      # def get_cell_colors(self): 
                
      #  dark_grey = (26, 31, 40)
      #  green = (47, 230, 23)
      #  red = (232, 18, 18)
      #  orange = (226, 116, 17)
      #  yellow = (237, 234, 4)
      #  purple = (166, 0, 247)
      #  cyan = (21, 204, 209)
      #  blue = (13, 64, 216)
         
      #  return [dark_grey, green, red, orange, yellow, purple, cyan, blue]

   def is_inside(self, row, column):
      if row >= 0 and row < self.num_rows and column >= 0 and column < self.num_cols:
         return True
      return False
    
   def is_empty(self, row, column):
      if self.grid[row][column] == 0:
         return True
      return False
    
   def is_row_full(self, row):
      for column in range(self.num_cols):
         if self.grid[row][column] == 0:
            return False
      return True
    
   def clear_row(self, row):
      for column in range(self.num_cols):
          self.grid[row][column] == 0

   def move_row_down(self, row, num_rows):
      for column in range(self.num_cols):
          self.grid[row+num_rows][column] = self.grid[row][column]
          self.grid[row][column] = 0

   def clear_full_rows(self):
      completed = 0
      for row in range(self.num_rows-1, 0, -1):
         if self.is_row_full(row):
            self.clear_row(row)
            completed += 1
         elif completed > 0:
            self.move_row_down(row, completed)
      return completed
   
   def reset(self):
      for row in range(self.num_rows):
         for column in range(self.num_cols):
            self.grid[row][column] = 0

   def draw(self,screen): # Day1
       for row in range(self.num_rows):
          for column in range(self.num_cols):
            cell_value = self.grid[row][column]
            cell_rect = pygame.Rect(column*self.cell_size + 11, row*self.cell_size + 11,
            self.cell_size -1, self.cell_size -1)
            pygame.draw.rect(screen, self.colors[cell_value], cell_rect) # Day1
