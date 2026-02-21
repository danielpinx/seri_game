import turtle as t

#t.shape()
t.shape("turtle")
#t.shape("arrow")
#t.shape('circle')
#t.shape('square')
#t.shape('triangle')

t.color('green')
t.bgcolor('light blue')

t.speed(5)
# Triangle
t.color("purple")
t.pensize(15)
t.forward(100)
t.left(120)
t.forward(100)
t.left(120)
t.forward(100)
t.left(120)
t.clear()

# Square
t.color("blue")
t.pensize(15)
t.forward(100)
t.left(90)
t.forward(100)
t.left(90)
t.forward(100)
t.left(90)
t.forward(100)
t.clear()

#Circle
t.color("green")
t.pensize(15)
t.circle(100)
t.clear()

#Arrow
t.color("yellow")
t.pensize(30)
t.forward(190)
t.right(90)
t.forward(70)
t.left(123)
t.forward(150)
t.left(120)
t.forward(150)
t.left(119)
t.forward(80)
t.right(91)
t.forward(190)


t.mainloop()