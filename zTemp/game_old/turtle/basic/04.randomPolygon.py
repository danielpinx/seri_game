import turtle as t  #import turtle module
import random       #import randomly

t.shape("turtle")
t.bgcolor("light blue")
t.color("green")
t.speed(100)

for x in range(500):    #x = 0,...,499, draw 500 times
    a = random.randint(1,360)   #randomly choose a number in between 1-360 and put it in a
    t.setheading(a)     #setting the head to angle to a
    t.fd(10)            #go follow the head's angle and go fd 10


t.mainloop()