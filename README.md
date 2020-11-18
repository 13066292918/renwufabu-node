node+layui  账号注册登录-任务发布-评价功能
====


1.设计数据库.
----
>>>规定账号,密码,名称,权限格式.和发布任务的格式

```javascript

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

```

2.主页面
====
运用layui来制作主页面

3.注册页面
====
>>>layui监听表单点击事件,把数据发送到后端
```javascript
layui.use('form', function(){
        var form = layui.form;
        var $ = layui.$
        //监听提交
        form.on('submit(formDemo)', function(data){
            $.ajax({
                url:'/reg',
                method:'post',
                data:{
                    username:data.field.username,
                    password:data.field.password
                },
                success:function (data){
                    layer.confirm('确认注册', {icon: 3, title:'提示'}, function(index){
                        layer.alert(data.msg,function (){
                            location.href='/login'
                        })
                        layer.close(index);
                    });
                }
            })
            return false;
        });
    });
```

>>>后端接受到请求,先查询后台用户名是否存在,不存在的情况下,才创建新用户
```javascript
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
```
