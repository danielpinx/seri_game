import random as r

w=['Apples','Grapes','mangoes','blueberries','Grapefruits']
s=1
q=r.choice(w)
input("Press the enter key to start")

while s<=6:
    print(s)
    print(q)
    t=input()
    if t==q:
        print("Great Job!:)")
        s=s+1
        q=r.choice(w)
    else:
        print("Try Again:|")

print("All Done!")