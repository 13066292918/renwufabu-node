const express = require('express')
const {user,task} = require('../model/sch')
const router = express.Router()
const crypto = require('crypto')

router.use(function (req,res,next){
    if (req.session.login && req.session.user.level>=10) {
        return next()
    }else {
        res.send('没有权限')
    }
})

router.get('/user',function (req,res){
    res.render('admin/user',{
        user:req.session.user,
        title:'用户管理'
    })
}).post('/user',function (req,res){
    Promise.all([
        user.find().skip( (req.body.page - 1 ) * req.body.limit ).limit(Number(req.body.limit)),
        user.countDocuments()//总共多少条数据
    ]).then(function (data){
        res.send({code:0,data:data[0],count:data[1]})
    })
})

router.post('/user/reuserd',function (req,res){
    user.findOne({_id:req.body.user_id},function (err,data){//验证当前账号与要修改的账号权限
        if (req.body.user_id === req.session.user._id || data.level >= 999){
            return res.send({code:1,data:'修改失败,权限不足'})
        }else {
            user.updateOne({_id:req.body.user_id},{$set:{used:req.body.used}},function (){
                res.send({code:0,data:'修改成功'})
            })
        }
    })
})

router.post('/user/del',function (req,res){
    if(!req.body.id){
        return res.send({code:1,msg:'参数错误'})
    }
    user.findOne({_id:req.body.id},function (err,data){
        console.log(data)
        if (data.level >= 999){
            return res.send({code:1,msg:'权限不足'})
        }else if(data._id === req.session.user._id){
            console.log(1111);
            return res.send({code:1,msg:'不能删除自身'})
        }

        Promise.all([
            task.deleteMany({author:req.body.id}),
            user.deleteOne({_id:req.body.id}),
            task.updateMany({'receiver.user': req.body.id},{$pull:{'receiver.user': req.body.id}})
        ]).then(function (){
            res.send({code:0,msg:'删除成功'})
        })
    })

})

router.post('/user/edit',function (req,res){
    user.updateOne({_id:req.body._id},{$set:{level:req.body.level}},function (){})
})

router.get('/task/add',function (req,res){
    res.render('admin/addtask',{
        title:'发布',
        user:req.session.user
    })
})

router.post('/task/add',function (req,res){
    const data = req.body
    data.author = req.session.user._id
    task.create(data,function (err,d){
        if (err){
            return res.send({code:1})
        }
        user.updateOne({_id:req.session.user._id},{$push:{'task.publish':d._id}},function (){
        })
        res.send({code:0,data:'保存成功'})
    })
})

router.get('/task/all',function (req,res){
    res.render('admin/deltask',{
        user:req.session.user,
        title:'任务管理'
    })
})

router.post('/task/del',function (req,res){
    Promise.all([
        task.deleteOne({_id:req.body._id}),
        user.updateMany(
            {$or: [{'task.publish':req.body._id}, {'task.receive': req.body._id},{'task.accomplish':req.body._id}]},
            {$pull:[{'task.publish':req.body._id}, {'task.receive': req.body._id},{'task.accomplish':req.body._id}]}
            )
    ]).then()
})

module.exports = router