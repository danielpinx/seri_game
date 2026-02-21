import turtle as t

t.shape("turtle")
t.color("green")
t.bgcolor("light blue")
t.speed(5)

for s in range(3):
    t.forward(100)
    t.left(120)

for q in range(4):
    t.forward(100)
    t.left(90)


t.mainloop()