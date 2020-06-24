const express = require('express')
const app = express()

app.get('/user',(req,res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.send('吴亦凡')
})

app.get('/age',(req,res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.send('18')
})

app.get('/info',(req,res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.send('上海')
})

app.listen(3000,err => {
  if (err) console.log(err)
  else console.log('服务器3000端口启动成功')
})