const express = require('express')
const multer = require('multer') //for image upload
const sharp = require('sharp');//for image crop
const User = require('../models/user')
const auth = require('../middleware/auth')
const {sendWelcomeEmail,sendCancelEmail} =require('../emails/account')

const router = new express.Router()

router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()
        sendWelcomeEmail(user.email,user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch (e) {
        res.status(400).send(e)
    }
})

// router.post('/users')

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (e) {
        res.status(400).send()

    }

})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})
router.post('/users/logoutAll', auth, async (req, res) => { //logging out from all account 
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
});

router.get('/users/me', auth, async (req, res) => { //2nd argument is middleware 
    // try {
    //     const users = await User.find({})
    //     res.send(users)
    // } catch (e) {
    //     res.status(500).send()
    // }

    res.send(req.user)
})

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        updates.forEach((update) => {
            req.user[update] = req.body[update]
        })
        await req.user.save();

        // const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }

        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try {
        // const user = await User.findByIdAndDelete(req.user._id)

        // if (!user) {
        //     return res.status(404).send()
        // }
        await req.user.remove()
        sendCancelEmail(req.user.email,req.user.name)
        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})

// const upload = multer({
//     dest: 'images'
// })
// router.post('/users/me/avatar', upload.single('upload'), (req, res) => {
//     res.send()
// })

const upload = multer({
    // dest: 'avatars',
    limits: {
        fileSize: 1000000 //stores in bytes
    },
    fileFilter(req, file, cb) { //function -> cb is callback
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image'))
        }
        cb(undefined, true)
        // cb(new Error('file must be a pdf'))
        // cb(undefined,true)
        // cb(undefined,false)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer
    // req.user.avatar=req.file.buffer   //use .file to store image in db 

    await req.user.save()
    res.send()
}, (error, req, res, next) => { //handles error ,does not show broken paage ..all erors need to be handled like this 
    //error,req,res,next is the format by which express knows it is for displaying error
    res.status(400).send({ error: error.message })

})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined  //use .file to store image in db 
    await req.user.save()
    res.send()
})

router.get('/user/:id/avatar', async (req, res) => {
    try {
        const user = User.findById(req.params.id)
        if (!user || !user.avatar) {
            throw new Error()
        }
        res.set('Content-Type', 'image/png')  //takes key value pair
        res.send(user.avatar)
    } catch (e) {
        req.status(404).send()
    }
})

module.exports = router