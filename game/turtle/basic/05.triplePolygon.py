import turtle as t  #import turtle module

t.shape("turtle")
t.bgcolor("black")
t.speed(0)

for x in range(200):        #x = 0,...,199
    if x %3 == 0:           #if x/3= no remainder, then light blue,(ex, x=3, 3/3=1 & no remainder)
        t.color("light blue")
    if x %3 == 1:           #if x/3= 1 remainder, then white
        t.color("white")
    if x %3 == 2:           #if x/3= 2 remainders, then light green
        t.color("light green")
    t.fd(x * 2)             #go forward twice as much as x(ex, x=3, then 3*2=6 go fd 6)
    t.left(119)             #turn left on 119 degrees every time

t.mainloop()    