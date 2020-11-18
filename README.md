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
运用layui来制作主页面,并且如果账号权限10级以上,显示后台进入接口(所有账号默认创建的时候10级)
<br/>
![](https://github.com/13066292918/renwufabu-node/blob/master/picture/01.png) 

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
![](https://github.com/13066292918/renwufabu-node/blob/master/picture/02.png)
<br/>

4.登录页面
====
>>>登录的时候验证账号是否存在,并把登录状态用session保存
```JavaScript
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
```


![](https://github.com/13066292918/renwufabu-node/blob/master/picture/03.png) 
<br/>
5.后台页面
====
>借用layui例子中的后台示例,功能:用户管理,任务管理,任务发布
>>查询后台用户数据,并发挥至前端
```JavaScript
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
```

![](https://github.com/13066292918/renwufabu-node/blob/master/picture/04.png) 

![](https://github.com/13066292918/renwufabu-node/blob/master/picture/05.png) 

![](https://github.com/13066292918/renwufabu-node/blob/master/picture/06.png) 
<br/>

6.任务详情
====
>>>监听表单点击事件,当用户点击的时候,进入详情页,并把用户id发送到后端.后端根据任务id,返回任务和用户数据到前台
```JavaScript
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
```


![](https://github.com/13066292918/renwufabu-node/blob/master/picture/07.png) 
<br/>

7.接取任务和发布评论
====
>>>接取任务时进行判断,是否登录,上限和已经接取过.都没有则把用户信息更新到任务表内
```JavaScript
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
```

![](https://github.com/13066292918/renwufabu-node/blob/master/picture/08.png)
<br/>

>>>当用户接取了任务之后,显示评价框.用户输入信息发送至后端,保存下来
```JavaScript
router.post('/xq/finmsg',function (req,res){
    task.updateOne({_id:req.body.taskid.split('/').slice(-1)},{$set:
            {['receiver.'+req.body.index+'.msg']:req.body.msg},
        ['receiver.'+req.body.index+'.finmsg']:true
    }).then(function (){
        res.send({code:0,msg:'上传成功'})
    })
})
```

![](https://github.com/13066292918/renwufabu-node/blob/master/picture/09.png) 
<br/>
