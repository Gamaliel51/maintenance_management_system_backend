const express = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const Student = require('../models/student')
const router = express.Router()

router
.post('/signup', async (req, res) => {
    const  { studentid, password, name, email } = req.body

    const in_use = await Student.findOne({where: {studentid: studentid.toLowerCase()}})
    if(in_use){
        return res.json({status: 'fail', error: 'student already exists'})
    }

    const hashedPass = await bcrypt.hash(password, 10)

    const user = await Student.create({
        studentid: studentid.toLowerCase(),
        password: hashedPass,
        studentname: name,
        studentemail: email,
    })

    await user.save()

    res.json({status: 'ok'})
})
.post('/login', async (req, res) => {
    const { studentid, password } = req.body

    if(req.user){
        return res.json({status: 'ok', message: 'loggedin'})
    }

    const user = await Student.findOne({where: {studentid: studentid.toLowerCase()}})

    if(user){
        const passcheck  = await bcrypt.compare(password, user.password)
        if(passcheck){
            const token = jwt.sign({username: user.studentid}, process.env.ACCESS_KEY, {expiresIn: '1d'})
            return res.json({status: 'ok', access: token})
        }
        return res.json({status: 'fail', error: 'wrong username or password'})
    }
    else{
        res.json({status: 'fail', error: 'wrong username or password'})
    }
})


module.exports = router