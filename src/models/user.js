
const Task = require('./task')
const mongoose = require ('mongoose')
const validator =require('validator')
const bcrypt =require('bcrypt')
const jwt = require('jsonwebtoken')

const userSchema = new mongoose.Schema(
    {
        name:{
            type:String,
            required:true
        },
        email :{
            type:String,
            required:true,
            unique:true,
            trim:true,
            lowercase:true,
            validate(value){
                if(!validator.isEmail(value)){
                    throw new Error( 'Invalid Email')
                }
            }
        },
        password:{
            type:String,
            required:true,
            trim:true,
            minlength:7,
            validate(value){
                if(value.toLowerCase().includes('password')){
                    throw new Error ('Passwor cannot contain Password')
                }
            }
        },
        age:{
            type:Number,
            validate(value){
                if(value <0){
                    throw new Error( 'Age must be a number')
                }
            }
        },
        tokens :[{
            token:{
                type:String,
                required:true
            }
        }],
        avatar:{
            type:Buffer
        }
    
    },{
        timestamps:true
    })  // creating schema to pass it to user for middleware
userSchema.statics.findByCredentials= async (email,password) =>{
    const user =await User.findOne({email})

    if(!user){
        throw new Error ('unable to login ')
    }
    const isMatch =await bcrypt.compare(password,user.password)

    if(!isMatch){
        throw new Error ('unable to login')
    }
    return user
}

userSchema.virtual('tasks',{
    ref:'Task',
    localField:'_id',
    foreignField:'owner'
})

userSchema.methods.generateAuthToken = async  function (){
    const user = this 
    const token = jwt.sign({_id:user._id.toString()},process.env.JWT_SECRET)
    user.tokens=user.tokens.concat({token})
    await user.save()
    return token 
}

userSchema.methods.toJSON =  function(){
    const user =this
    const userObject=user.toObject()
    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar
    return userObject
}


//Hash the plain text password before saving
userSchema.pre('save',async function( next){
    const user=this
    if(user.isModified('password')){
        user.password =await bcrypt.hash(user.password,8) //hashed password 

    }

    next()
})//ading middle ware

//delete user tasks when user is removedd 
userSchema.pre('remove',async function(next){
    const user=this
    await Task.deleteMany({owner:user._id})
    next()
})

const User=mongoose.model('User',userSchema) // model defined

module.exports=User