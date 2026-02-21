import turtle as t  #import turtle module

t.shape("turtle")
t.bgcolor("pink")
t.color("blue")
t.pensize(1.1)
t.speed(100)

#circle illusion
n=50

for x in range(n):      #x=n, n=50, x=0,...,49, draw 50 times
    t.circle(80)        #draw circles that have the capacity of 80
    t.left(10)          #turn left every circle

t.clear()

#square illusion
angle=89

for z in range(150):        #z = 0,...,149, draws 150 times
    t.forward(z)            #forward 0,...,149 adding up 1 every line
    t.left(angle)           #turns left 89 degrees


t.mainloop()