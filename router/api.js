const express = require('express')
const path = require('path')
const router = express.Router()
const multer = require('multer')
const {user,task} = require('../model/sch')



router.post('/upload',function (req,res){
    const storage = multer.diskStorage({
        destination: path.join(process.cwd(),'/public/upload'),
        filename:function (req,file,callback){
            const h = file.originalname.split('.')
            const filename = `${Date.now()}.${h[h.length-1]}`
            callback(null,filename)
        }
    })

    const filter = function (req,file,cb){//限制接受文件类型,没有允许就会拒绝
        if (file.mimeType === 'image/gif'){
            cb(null,true)
        }else{
            cb(null,false)
        }
    }

    const upload = multer({storage,filter})

    upload.single('file')(req,res,function (err){
        if (err){
            return res.send({code:1})
        }
        res.send({code:0,data:{
            src:`/upload/${req.file.filename}`
            }})
    })
});

router.post('/task/all',function (req,res){
    Promise.all([
        task.find().populate('author').sort({_id:-1}).skip((req.body.page-1)*req.body.limit).limit(Number(req.body.limit)),
        task.countDocuments()
    ]).then(function (data){
        res.send({code:0,data:data[0],count:data[1]})
    })
})

router.post('/task/can',function (req,res){
    Promise.all([
        task.find({can:false}).populate('author').sort({_id:-1}).skip((req.body.page-1)*req.body.limit).limit(Number(req.body.limit)),
        task.countDocuments({can:false})
    ]).then(function (data){
        res.send({code:0,data:data[0],count:data[1]})
    })
})

router.post('/task/notcan',function (req,res){
    Promise.all([
        task.find({can:true}).populate('author').sort({_id:-1}).skip((req.body.page-1)*req.body.limit).limit(Number(req.body.limit)),
        task.countDocuments({can:true})
    ]).then(function (data){
        res.send({code:0,data:data[0],count:data[1]})
    })
})

router.post('/task/my',function (req,res){
    user.findOne({_id:req.session.user._id})
        .populate({
            path:'task.publish',
            options:{
                sort:{_id:-1},
                skip:(req.body.page-1)*req.body.limit,
                limit:Number(req.body.limit)
            }
        }).then(function (data){
            res.send({code:0,data:data.task.publish,count:data.task.publish.length})
    })
})

router.post('/task/ing',function (req,res){
    user.findOne({_id:req.session.user._id}).populate({
        path:'task.receive',
        options:{
            sort:{_id:-1},
            skip:(req.body.page-1)*req.body.limit,
            limit:Number(req.body.limit)
        }
    }).then(function (data){
        console.log(data)
        res.send({code:0,data:data.task.receive,count:data.task.receive.length})
    })
})

router.post('/task/fin',function (req,res){
    user.findOne({_id:req.session.user._id}).populate({
        path:'task.accomplish',
        options:{
            sort:{_id:-1},
            skip:(req.body.page-1)*req.body.limit,
            limit:Number(req.body.limit)
        }
    }).then(function (data){
        res.send({code:0,data:data.task.accomplish,count:data.task.accomplish.length})
    })
})


module.exports = router