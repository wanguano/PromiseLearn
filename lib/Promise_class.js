/* 
  自定义Promise模块
  class版本
*/
(function (window) {
  const PENDING = 'pending' // 初始化未确认的状态
  const RESOLVED = 'resolved' // 成功状态
  const REJECTED = 'rejected' // 失败状态

  class Promise {
    /**
     * 通常执行异步任务 usual execute async task
     * @param {function} execute 同步执行器函数
     */
    constructor(execute) {
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

    /* then()主要功能执行传递的回调或保存回调
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
    then(onResolved, onRejected) {
      const self = this
      //onResolved的默认值
      onResolved = typeof onResolved === 'function' ? onResolved : (value) => value
      // onRejected的默认值,如果没有传递
      onRejected = typeof onRejected === 'function' ? onRejected : (reason) => { throw reason } //将reason向下传递
      // 返回新的promise对象,状态由onResolve或onRejected回调来决定
      return new Promise((resolve, reject) => {
        /**
         * 调用指定的回调函数callback
         * 根据callback执行结果来更新then()返回promise的状态
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
          // 异步调用onResolved
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
            resolve或reject调用的时候 返回的promise状态 一直是PENDING状态, 后面链式调用
            没有效果的 */
        else {
          self.callbacks.push({ // 不是直接成功/失败的回调,保存包含了回调函数调用的函数 
            onResolved(value) { // 在后面调用resolve()中执行
              handle(onResolved)
            },
            onRejected(reason) {
              handle(onRejected)
            }
          })
        }
      })


    }

    /** 用来指定失败的回调函数
     * catch是then的语法糖
     * @param {function} onRejected 失败的回调
     */
    catch (onRejected) {
      return this.then(undefined, onRejected)
    }


    /** 用来返回一个指定value的成功的promise
     * value可能是一个一般的值,也可能是promise对象
     * @param {any} value 
     */
    static resolve = function (value) {
      return new Promise((resolve, reject) => {
        if (value instanceof Promise) {
          value.then(resolve, reject)
        } else {
          resolve(value)
        }

      })
    }

    /** 用来返回一个指定reason的失败的promise
     *  用来返回一个指定reason的失败的promise
     * @param {function} reason 
     */
    static reject = function (reason) {
      return new Promise((resolve, reject) => {
        reject(reason)
      })
    }

    /**  返回一个promise对象,对象的状态由传递过来的promise数组来决定,只有全部成功才返回成功状态的promise
     * 返回一个promise对象,对象的状态由传递过来的promise数组来决定,只有全部成功才返回成功状态的promise
     * @param {Array} promises 
     */
    static all = function (promises) {
      let resolveCount = 0 // 已经成功的数量
      let values = new Array(promises.length) // 用来保存成功promise的value值
      return new Promise((resolve, reject) => {
        // 遍历所有promise,取其对应的结果
        promises.forEach((p, index) => {
          p.then(
            value => {
              // 如果判断传递promise数组全部成功? 计数
              resolveCount++
              values[index] = value
              if (resolveCount === promises.length) { // 全部成功了
                resolve(values)
              }
            },
            reason => {
              reject(reason)
            }
          )
        })
      })
    }

    /** 返回一个promise,对象的状态由传递的promise数组来决定,第一个返回状态的promise就是最终结果
     * 返回一个promise,对象的状态由传递的promise数组来决定,第一个返回状态的promise就是最终结果
     * @param {Array} promises 
     */
    static race = function (promises) {
      return new Promise((resolve, reject) => {
        // 遍历所有promise,取其对应的结果
        promises.forEach(p => {
          // 返回的promise由第一个完成p来决定其结果
          p.then(resolve, reject)
        })
      })
    }

    /** 延迟指定的时间才执行成功(或失败的)的promise
     * 延迟指定的时间才执行成功(或失败的)的promise
     * @param {function} value 
     * @param {number} time 
     */
    static resolveDelay = function (value, time) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (value instanceof Promise) {
            value.then(resolve, reject)
          } else {
            resolve(value)
          }

        }, time);
      })
    }

    /** 延迟指定的时间才执行失败的promise
     * 延迟指定的时间才执行失败的promise
     * @param {function} value 
     * @param {number} time 
     */
    static rejectDelay = function (reason, time) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(reason)
        }, time);
      })
    }
  }

  window.Promise = Promise
})(window)
