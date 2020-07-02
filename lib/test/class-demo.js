// 父类
class People {
  constructor(name)  {
    this.name = name
  }
  eat() {
    console.log(`${this.name} eat something`)
  }
}

// 子类
class Student extends People {
  constructor(name, number) {
    super(name)
    super.eat()
    this.number = number
  }
  sayHi() {
    console.log(`姓名 ${this.name} 学号 ${this.number}`)
  }
}

const stu = new Student('夏洛',100)
console.log(stu.name)
console.log(stu.number)
stu.sayHi()
stu.eat()
