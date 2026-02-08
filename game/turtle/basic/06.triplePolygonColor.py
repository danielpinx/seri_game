import turtle as t

t.shape("turtle")
t.bgcolor("black")
t.speed(0)

for s in range(200):
    if s %3 == 0:
        t.color("red")
    if s %3 == 1:
        t.color("blue")
    if s %3 == 2:
        t.color("yellow")
    t.fd(s * 2)
    t.left(119)


t.mainloop()