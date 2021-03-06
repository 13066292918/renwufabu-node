const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username:{type:String,require:true},
    password:{type:String,require:true},
    used:{type:Boolean,require:true,default:false},  //账号是否可用
    level:{type:Number,require:true,default: 10},
    task:{
        //发布任务
        publish:{type:[{type:mongoose.Schema.Types.ObjectId,ref:'task'}]},
        //已经接取任务
        receive:{type:[{type:mongoose.Schema.Types.ObjectId,ref:'task'}]},
        //已经完成
        accomplish:{type:[{type:mongoose.Schema.Types.ObjectId,ref:'task'}]}
    }
})
//任务详情
const taskSchema = new mongoose.Schema({
    title:{type:String},//标题
    content:{type:String},//内容
    author:{type:mongoose.Schema.Types.ObjectId,ref:'user'},//作者
    receiver:{type:[{
                user: {type: mongoose.Schema.Types.ObjectId,ref:'user'},
                msg: {type: String},
                finmsg:{type:Boolean,default:false}
            }]},//接取人
    time:{type:String,default:new Date()},//发布时间
    num:{type:Number},//接取人数限制
    reward:{type:String},
    difficulty:{type:String},//难度
    expiration:{type:String},//截止时间
    can:{type:Boolean,default:false},
    msg:{type:[{
        user: {type:mongoose.Schema.Types.ObjectId},
            msg:{type:String}
        }]}
})

const user = mongoose.model('user',userSchema)
const task = mongoose.model('task',taskSchema)

module.exports={
    user,
    task
}