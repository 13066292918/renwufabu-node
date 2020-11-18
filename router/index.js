const express = require('express')
const {user,task} = require('../model/sch')
const router = express.Router()
const crypto = require('crypto')

router.get('/',function (req,res){
    res.render('index',{
        login:req.session.login,
        user:req.session.user,
        title:'首页'
    })
})

//注册成功  0  ,失败   1

router.get('/reg',function (req,res){
    res.render('reg')
}).post('/reg',function (req,res){
    user.findOne({username: req.body.username}).then((data)=>{
        const c = crypto.createHash('sha256')
        const password = c.update(req.body.password).digest('hex')
        if(data){
            return res.send({code:2,msg:"用户已存在"})
        }
        user.create({
            username:req.body.username,
            password:password
        }).then((data)=>{
            res.send({code:1,msg:"创建成功"})
        })
    })
})

router.get('/login',function (req,res){
    res.render('login',{login:req.session.login})
}).post('/login',function (req,res){
    user.findOne({username: req.body.username}).then((data)=>{
        const c = crypto.createHash('sha256')
        const password = c.update(req.body.password).digest('hex')
        if(data){
            if (data.password === password){
                req.session.login = true
                req.session.user = data
                return res.send({code:0,msg:'登录成功'})
            }
            return res.send({msg:'密码错误'})
        }
        res.send({msg:"用户不存在"})
    })
})

router.get('/logout',function (req,res){
    req.session.destroy()
    res.redirect('/')
})

router.get('/task/:id',function (req,res){
    task.findOne({_id:req.params.id}).populate('author receiver.user').exec(function (err,data){
        const a= data.receiver.findIndex(function (value){
            return String(value._id) === req.session.user._id
        })
        res.render('xq',{
            title:'详情页'+data.title,
            user:req.session.user,
            login:req.session.login,
            data:data,
            a:a
        })
    })
})

router.post('/task/:id',function (req,res){
    if (!req.session.login){
        return res.send({code:1,msg:"请登录"})
    }
    task.findOne({_id:req.params.id}).populate('author receiver.user').exec(function (err,data){
        const a= data.receiver.findIndex(function (value){
            return String(value._id) === req.session.user._id
        })
        if (a === -1){
            return res.send({code:1,msg:"已达接取上限"})
        }
    })
    Promise.all([
        task.updateOne({_id:req.params.id},{$push:{receiver: {user:req.session.user._id}}}),
        user.updateOne({_id:req.session.user._id},{$push:{'task.receive':req.params.id}})
    ]).then(function (){
        res.send({code:0,msg:'接取成功'})
    })

})

router.post('/xq/finmsg',function (req,res){
    task.updateOne({_id:req.body.taskid.split('/').slice(-1)},{$set:
            {['receiver.'+req.body.index+'.msg']:req.body.msg},
        ['receiver.'+req.body.index+'.finmsg']:true
    }).then(function (){
        res.send({code:0,msg:'上传成功'})
    })
})

module.exports = router
