/* 
  自定义Promise模块
*/
(function (window) {
  const PENDING = 'pending' // 初始化未确认的状态
  const RESOLVED = 'resolved' // 成功状态
  const REJECTED = 'rejected' // 失败状态

  /**
   * 通常执行异步任务 usual execute async task
   * @param {function} execute 同步执行器函数
   */
  function Promise(execute) {
    // 初始化属性
    const self = this // Promise的实例对象
    self.status = PENDING // 状态属性,初始状态为pending
    self.data = undefined // 用来存储结果数据的属性,初始值为undefined
    self.callbacks = [] // 保存then()传递的回调函数

    /**
     * 将promise状态改为成功,指定成功的value
     * @param {any} value 
     */
    function resolve(value) {
      // 如果当前不是pending状态直接结束
      if (self.status !== PENDING) return
      self.status = RESOLVED // 改变为成功状态
      self.data = value // 数据存储
      // 异步调用所有缓存的待执成功的回调函数
      if (self.callbacks.length > 0) {
        setTimeout(() => {
          self.callbacks.forEach(callbacksObj => {
            callbacksObj.onResolved(value)
          })
        })
      }
    }

    /**
     * 将promise状态改为失败,指定失败的reason
     * @param {any} reason 失败的reason
     */
    function reject(reason) {
      // 如果当前不是pending状态直接结束
      if (self.status !== PENDING) return
      self.status = REJECTED
      self.data = reason
      // 异步调用所有缓存的待执失败的回调函数
      if (self.callbacks.length > 0) {
        setTimeout(() => {
          self.callbacks.forEach(callbacksObj => {
            callbacksObj.onRejected(reason)
          })
        })
      }
    }

    // 调用execute来启动异步任务
    try {
      // 如果同步执行器函数抛异常
      execute(resolve, reject)
    } catch (error) {
      // 改变失败状态,并将失败信息传递
      reject(error)
    }
  }

  /* 
    用来指定成功/失败的回调函数
      1. 如果当前promise是resolved,异步执行成功的回调函数onResolved
      2. 如果当前promise是rejected,异步执行失败的回调函数onRejected
      3. 如果当前promise是pending,保存回调函数
    返回一个新的promise对象
      它的结果状态由onResolved或onRejected执行的结果决定
      2.1 抛出error ==> 变为rejected,结果值为error
      2.2 返回值不是promise ==> resolved,结果值为返回值
      2.3 返回值是promise ==> 由这个promise决定新的promise的结果(成功/失败)
  */
  Promise.prototype.then = function (onResolved, onRejected) {
    const self = this

    return new Promise((resolve, reject) => {
      /**
       * 调用指定的回调函数callback
       * 根据callback()执行结果来更新then()返回promise的状态
       * @param {function} callback 要调用的回调函数
       */
      function handle(callback) {
        try {
          // 执行成功的异步回调
          const result = callback(self.data)
          if (result instanceof Promise) {
            result.then(
              value => resolve(value),
              reason => reject(reason)
            )

            // result.then(resolve, reject)
          } else {
            resolve(result)
          }
        } catch (error) {
          reject(error)
        }
      }

      // RESOLVED状态
      if (self.status === RESOLVED) {
        setTimeout(() => {
          handle(onResolved)
        })
        // REJECTED状态
      } else if (self.status === REJECTED) {
        setTimeout(() => {
          handle(onRejected)
        })
      }
      /* PENDING状态,保存传递自定义的的回调, 因为直接将then()传递的回调保存起来时, 后面
          reoslve或rejecte调用的时候 返回的promise状态 一直是PENDING状态, 后面链式调用
          没有效果的 */   
      else { 
        self.callbacks.push({ // 不是直接成功/失败的回调,保存包含了回调函数调用的函数 
          onResolved(value) { // 在后面调用resovle()中执行
            handle(onResolved)
          },
          onRejected(reason) {
            handle(onRejected)
          }
        })
      }
    })
  }




  /**
   * 用来指定失败的回调函数
   * @param {function} onRejected 失败的回调
   */
  Promise.prototype.catch = function (onRejected) {

  }

  /**
   * 用来返回一个指定value的成功的promise
   * @param {any} value 
   */
  Promise.resolve = function (value) {

  }

  /**
   *  用来返回一个指定reason的失败的promise
   * @param {function} reason 
   */
  Promise.reject = function (reason) {

  }

  /**
   * 返回一个promise对象,对象的状态由传递过来的promise数组来决定,只有全部成功才返回成功状态的promise
   * @param {Array} promises 
   */
  Promise.prototype.all = function (promises) {

  }

  /**
   * 返回一个promise,对象的状态由传递的promise数组来决定,第一个返回状态的promise就是最终结果
   * @param {Array} promises 
   */
  Promise.prototype.race = function (promises) {

  }

  window.Promise = Promise

})(window)

/**
 * 问题: execute then()方法时,是PENDING状态,将函数保存起来时以供改变状态时调用,但是then方法返回的Promise是什么状态
 * 将onRsolved和onRjected放入异步回调数组中,将来resolve或reject改变状态后调用的时候
 * then()方法如何返回返回指定的promise和状态
 */