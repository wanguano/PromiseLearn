/* promise custom */
(function () {
  // init change status
  const PENDING = 'pending'
  const RESOLVED = 'resolved'
  const REJECTED = 'rejected'
  /**
   * 通常执行异步任务 usual execute async task
   * @param {function} execute 同步执行器函数
   */
  function Promise(execute) {
    // 初始化状态和数据
    const self = this;
    self.data = undefined
    self.status = PENDING
    self.callbacks = [] // 用来保存then()方法传递的回调函数


    // resolve改变promise状态为成功状态,保存数据
    function resolve(value) {
      self.status = RESOLVED
      self.data = value
      // 先判断then传递的回调数组是否有回调函数
      if (self.callbacks.length > 0) {
        // 执行then()传递的回调,并以异步方法执行
        setTimeout(() => {
          self.callbacks.forEach(promiseObj => {
            promiseObj.onResolved(self.data)
          })
        })
      }
    }

    // reject改变promise状态为失败状态,保存数据
    function reject(reason) {
      self.status = REJECTED
      self.data = reason
      // 先判断then传递的回调数组是否有回调函数
      if (self.callbacks.length > 0) {
        // 执行then()传递的回调,并以异步方法执行
        setTimeout(() => {
          self.callbacks.forEach(promiseObj => {
            promiseObj.onRejected(self.data)
          })
        })
      }
    }

    try {
      // 执行同步执行器函数
      execute(resolve, reject)
    } catch (error) {
      reject(error)
    }




  }


  /**
   * 4.开始实现then(onResolved,onRejected())实例方法
		(1)用来指定成功/失败的回调函数
      		1. 如果当前promise是resolved,异步执行成功的回调函数onResolved
      		2. 如果当前promise是rejected,异步执行失败的回调函数onRejected
      		3. 如果当前promise是pending,保存回调函数
    	(2)返回一个新的promise对象
      	它的结果状态由onResolved或onRejected执行的结果决定
      	2.1 抛出error ==> 变为rejected,结果值为error
	      2.2 返回值不是promise ==> resolved,结果值为返回值
    	  2.3 返回值是promise ==> 由这个promise决定新的promise的结果(成功/失败)
   * @param {function} onResolved 成功的回调
   * @param {function} onRejected 失败的回调
   */
  Promise.prototype.then = function (onResolved, onRejected) {
    const self = this
    return new Promise((resolve, reject) => {

      /**
       * 调用回调函数,获取回调的结果,根据结果调用resolve或reject
       * @param {function} callback 回调函数
       */
      function handle(callback) {
        try {
          // 成功状态调用onReject()
          const result = callback(self.data)
          if (result instanceof Promise) {
            result.then(
              value => resolve(value),
              reason => reject(reason)
            )
            // 简写形式
            //result.then(resolve, reject)
          } else {
            resolve(result)
          }
        } catch (error) {
          reject(error)
        }
      }


      // 返回的promise状态有then()传递的回调函数来确定
      if (self.status === RESOLVED) {
        setTimeout(() => {
          handle(onResolved)
        })
      } else if (self.status === REJECTED) {
        setTimeout(() => {
          handle(onRejected)
        })
      } else {
        // PENDING状态,不能直接保存then()传递的回调(应该创建自定义回调)
        // 返回的promise状态由then()传递的回调来决定
        self.callbacks.push({
          // 以下方法是异步执行👇, 在resolve中的定时器调用
          onResolved() {
            handle(onResolved)
          },
          onRejected() {
            handle(onRejected)
          }
        })
      }



    })
  }

  window.Promise = Promise

}())