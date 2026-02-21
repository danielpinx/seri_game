import turtle as t

def blank():
    t.clear()

t.pensize(3)
t.color("blue")
t.bgcolor("light blue")
t.shape("turtle")
t.speed(0)

t.hideturtle()
t.onscreenclick(t.goto)
t.onkeypress(blank,"Escape")
t.listen()


t.mainloop()