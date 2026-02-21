## about Turtle module

https://docs.python.org/3/library/turtle.html


## Command

turtle 모듈 import

    import turtle
    - turtle 모듈을 불러옴.

    import turtle as t
    - turtle 모듈을 불러오고 turtle 대신 t를 사용한다.
    - 즉. turtle.forward(100)이 아니라 t.forward(100) 의 형식을 사용한다.

    from turtle import *
    - turtle 모듈을 불러오고 turtle을 생략한다.
    - 즉. turtle.forward(100)이 아니라 forward(100) 의 형식을 사용한다.

turtle 그래픽 기본 명령어

    turtle.shape('turtle')
    - t(turtle 모듈)의 아이콘을 거북이 모양으로 바꿈.
    - 기본 아이콘은 화살표. turtle.shape('classic')
    - 삼각형 아이콘은 turtle.shape('triangle')
    - 원 아이콘은 turtle.shape('circle')

    turtle.forward(50)
    - 거북이 머리 방향으로 50만큼 이동.
    - 약자 : turtle.fd(50)

    turtle.backward(50)
    - 거북이 머리 반대 방향으로 50만큼 이동.
    - 약자 : turtle.back(50)

    turtle.right(90)
    - 거북이 머리 방향에서 오른쪽으로 90도 회전.
    - 약자 : turtle.rt(90)

    turtle.left(30)
    - 거북이 머리 방향에서 왼쪽으로 30도 회전.
    - 약자 : turtle.lt(90)

    turtle.setheading(x)
    - x 각도로 회전한다.
    - 오른쪽이 기준이다. 삼각함수에서 동경의 개념과 같다. 즉, x축의 양의 방향을 기준으로 시계 반대방향의 각이 x가 된다.

    turtle.circle(50)
    - 반지름이 50인 원을 그린다.

    turtle.color('red') 
    - 펜과 칠하는 색깔을 모두 빨간색으로 설정한다.
    - 기본 설정은 검은색이다.
    - red, green, blue 등 색 이름을 영어로 그대로 이용한다.
    - turtle.color('red', 'blue') 는 펜의 색은 빨간색, 칠하는 색은 파란색으로 설정한다.

    turtle.pencolor('red')
    - 도형을 그리는 선의 색을 빨간색으로 설정한다.

    turtle.fillcolor('red')
    - 도형 내부를 칠하는 색을 빨간색으로 설정한다.
    - 주의할 것은 아래의 begin_fill()과 end_fill()과 같이 써야 한다. 도형을 모두 그린 다음에 fillcolor를 쓰는 것이 아니라 다음과 같은 순서로 사용해야 한다.

    turtle.bgcolor('black')
    - 배경화면 색을 검은 색으로 바꾼다.

    turtle.colormode(255)
    - turtle.color(Red, Green, Blue) 형식으로 색을 선택할 수 있는 때 이 때 입력 방식을 바꾸는 설정이다.
    - 색을 입력하는 방식을 RGB의 최댓값을 255으로 설정을 바꾼다.
    - 초기 설정은 turtle.colormod(1.0)으로 각 색의 최댓값이 1이다.

    turtle.pensize(5)
    - 펜의 굵기를 5(픽셀)로 변경한다.

    turtle.penup()
    - 펜을 든다는 명령어로 이 상태에서 이동하면 선을 그리지 않는다.
    - 약자 : turtle.up()

    turtle.pendown()
    - 펜을 내린다는 명령어로 선을 그리는 상태가 된다.
    - 약자 : turtle.down()

    turtle.speed(속도)
    - 거북이 움직이는 (그림이 그려지는) 속도를 조절한다.
    - 1이 느리고 10이  빠르다.다만 0이 최고 속도이다. 시간이 걸리지 않는다는 개념으로 0을 이해하면 될 듯.
    - 속도의 값이 10을 넘어서면 0으로 처리한다. 예를 들어 speed(1000) = speed(0) 이다.

    turtle.showturtle()
    - 거북이를 화면에 표시한다.
    - 약자 : st()

    turtle.hideturtle()
    - 거북이를 화면에서 숨긴다. showturtle과 반대
    - 약자 : ht()

    turtle.clear()
    - 화면을 지우지만 거북이는 그 자리에 그대로 있음.

    turtle.home()
    - 화면은 그대로 두고 거북이는 처음 위치로 돌아옴.

    turtle.reset()
    - 화면을 지우고 거북이도 초기 위치로 돌아옴.
    - 펜 색깔, 굵기 등 기본 설정까지 모두 초기화 된다.

좌표와 관련된 명령어

    turtle.position() 
    - 거북이 그래픽 창은 가운데 지점을 원점으로 하는 x축, y축이 존재한다.
    - 거북이의 초기 위치는 원점이며 turtle.position()은 거북이의 현재 위치(좌표)를 의미한다.
    - (x, y) = turtle.position() 은 현재 좌표를 (x, y)에 저장한다.
    - 약자 : turtle.pos()

    turtle.xcor()
    - 현재 위치의 x좌표

    turtle.ycor()
    - 현재 위치의 y좌표

    turtle.goto(a, b)
    - 좌표 (a,b)로 이동
    - turtle.setpos(a,b)도 같은 명령어

    turtle.distance(a, b)
    - 현재 위치와 점(a, b)의 거리를 구한다.

    turtle.heading()
    - 거북이가 바라보는 방향의 각도(동경)을 구한다.

    turtle.towards(x,y)
    - 현재좌표와 (x,y)를 잇는 선분의 각도(동경)을 구한다.

    turtle.setheading(a)
    - 동경이 각 a인 방향으로 회전한다.

    turtle.home() 
    - 거북이의 위치와 각을 초기화 한다. 즉, (0,0)의 좌표 동경은 0도로 정한다.

입출력과 관련된 명령어

    turtle.onkeypress(함수,"키 이름")
    예)
    def up():
        turtle.setheading(90)
        turtle.forward(10)

    turtle.onkeypress(up,"Up")
    - Up 키 (위로 이동키)를 누르면 up함수를 호출하여 위로 10만큼 이동함.
    - 키이름은 Up, Down, Right, Left, Escape, space 등 고유이름이 있는 경우가 있고, 알파벳이나 숫자의 경우 그대로 입력하면 된다. 대소문자 구별하므로 주의할 것.

    turtle.listen()
    - 이 명령어를 실행시켜야 키 입력모드가 실행되어 입력된 키에 반응한다.
    - 보통 코드의 끝부분에 위치한다.

    turtle.mainloop()
    - 편집기에 따라 코드가 끝난 후 거북이 창이 바로 종료될 경우 마지막에 이 코드를 추가한다.
    - turtle.done() 과 같은 명령어이다.

    turtle.onscreenclick(함수)
    - 화면을 클릭했을 때 함수를 실행한다.
    - 실행되는 함수는 현재 좌표인 (x, y)를 매개변수로 해야 한다.
    - 다음과 같이 활용할 수도 있다.
    예) turtle.onscreenclick(turtle.goto)
    - turtle.goto함수에 자동으로 현재위치를 매개변수로 주어 실행한다.
    - 즉, 클릭한 곳으로 이동한다.

    turtle.ontimer(함수, 시간)
    - 일정한 시간후에 함수를 실행한다.
    - 시간의 단위는 1/1000초이다. 즉, 1000이라 쓰면 1초가 된다.

    turtle.title("창 이름")
    - 거북이 창의 이름을 붙인다. 초기값은 Untitle이다.

    turtle.write("문자열")
    - 현재 거북이 위치에 문자를 출력한다.
    - 정식 문법은 다음과 같다.
    turtle.write(arg, move=False, align="left", font=("Arial", 8, "normal"))
    - arg에는 출력할 문자열이 들어간다.
    - move 값이 True이면 거북이 위치가 문자열이 끝나는 곳으로 이동하고 False이면 거북이는 이동하지 않는다.
    기본 설정값(생략한 경우의 값)은 False이다.
    - align은 정렬 방식으로 left는 왼쪽 정렬, right는 오른쪽 정렬, center는 가운데 정렬이다.
    - font는 (폰트 종류, 폰트 크기, 폰트 상태) 순서로 입력한다. 폰트 상태(굵게, 기울임 등)는 생략 가능하다. 기본 설정은 normal이다.
    예) turtle.write("Hello", False, "center", ("",20))
    - 현재 위치에 가운데 정렬로 크기가 20인 Hello를 출력하고 거북이는 이동하지 않는다.


## Reference

https://blog.naver.com/python_math/221214856867