const express = require('express')
const app = express()
const mongoose = require("mongoose")
const session =require('express-session')
const Mongosession = require('connect-mongo')(session)

mongoose.connect('mongodb://localhost/a',{useNewUrlParser: true,useUnifiedTopology:true})

app.use(session({
    secret:'wsefwf',//密钥
    rolling:true,//每次页面刷新或者点击a标签  ajax,重新设定保存时间
    resave:false,//每次重新请求,是否保存数据
    saveUninitialized:false,//是否设置初始值
    cookie:{maxAge:1000*60*60},//保存时间
    store:new Mongosession({
        url:'mongodb://localhost/a'
    })
}))

app.use(express.json())
app.use(express.urlencoded({extended:false}))

app.use(express.static(__dirname +'/public'))//静态资源目录

app.set("views",__dirname + "/view")//模版引擎
app.set('view engine','ejs')

app.use('/',require('./router/index'))
app.use('/admin',require('./router/admin'))
app.use('/api',require('./router/api'))

app.listen(2333)
