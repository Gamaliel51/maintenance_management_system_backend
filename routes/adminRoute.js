const express = require('express')
const { checkAuth } = require('../controllers/authMiddleware')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Admin = require('../models/Admin')
const Complaint = require('../models/Complaint')

const router = express.Router()

router
.get('/init', async (req, res) => {
    const pass = '123'
    const hashedPass = await bcrypt.hash(pass, 10)
    const admin = await Admin.create({
        username: 'israel',
        password: hashedPass,
        registrar_email: 'e@gmail.com',
        vc_email: 'e@gmail.com',
        ppd_director_email: 'e@gmail.com',
    })

    await admin.save()

    res.json({status: 'ok'})
})
.get('/getallcomplaints', checkAuth, async (req, res) => {
    const all_complaints = await Complaint.findAll()
    if(!all_complaints){
        return res.json({status: 'fail', error: 'there are no records'})
    }
    const send_data = all_complaints.map((complaint) => {
        return {complaint_id: complaint.complaint_id, studentid: complaint.studentid, studentname: complaint.studentname, 
            studentemail: complaint.studentemail, building: complaint.building, category: complaint.category, item: complaint.item, 
            location: complaint.location, status: complaint.status, start_date: complaint.start_date, 
            complete_date: complaint.complete_date
        }
    })

    res.json({status: 'ok', data: send_data})
})
.get('/getalldonecomplaints', checkAuth, async (req, res) => {
    const all_complaints = await Complaint.findAll({where: {status: 'completed'}})
    if(!all_complaints){
        return res.json({status: 'fail', error: 'there are no records'})
    }
    const send_data = all_complaints.map((complaint) => {
        return {complaint_id: complaint.complaint_id, studentid: complaint.studentid, studentname: complaint.studentname, 
            building: complaint.building, category: complaint.category, item: complaint.item, location: complaint.location, 
            status: complaint.status, start_date: complaint.start_date, complete_date: complaint.complete_date
        }
    })

    res.json({status: 'ok', data: send_data})
})
.get('/getallprogresscomplaints', checkAuth, async (req, res) => {
    const all_complaints = await Complaint.findAll({where: {status: 'in progress'}})
    if(!all_complaints){
        return res.json({status: 'fail', error: 'there are no records'})
    }
    const send_data = all_complaints.map((complaint) => {
        return {complaint_id: complaint.complaint_id, studentid: complaint.studentid, studentname: complaint.studentname, 
            building: complaint.building, category: complaint.category, item: complaint.item, location: complaint.location, 
            status: complaint.status, start_date: complaint.start_date, complete_date: complaint.complete_date
        }
    })

    res.json({status: 'ok', data: send_data})
})
.get('/getallreceivedcomplaints', checkAuth, async (req, res) => {
    const all_complaints = await Complaint.findAll({where: {status: 'received'}})
    if(!all_complaints){
        return res.json({status: 'fail', error: 'there are no records'})
    }
    const send_data = all_complaints.map((complaint) => {
        return {complaint_id: complaint.complaint_id, studentid: complaint.studentid, studentname: complaint.studentname, 
            building: complaint.building, category: complaint.category, item: complaint.item, location: complaint.location, 
            status: complaint.status, start_date: complaint.start_date, complete_date: complaint.complete_date
        }
    })

    res.json({status: 'ok', data: send_data})
})
.post('/login', async (req, res) => {
    try{
        const { username, password } = req.body

        if(req.user){
            return res.json({status: 'ok', message: 'loggedin'})
        }

        const user = await Admin.findOne({where: {username: username}})

        if(user){
            const passcheck  = await bcrypt.compare(password, user.password)
            if(passcheck){
                const token = jwt.sign({username: user.username}, process.env.ACCESS_KEY, {expiresIn: '1d'})
                return res.json({status: 'ok', accessAdmin: token})
            }
            return res.json({status: 'fail', error: 'wrong username or password'})
        }
        else{
            res.json({status: 'fail', error: 'wrong username or password'})
        }
    }
    catch(err){
        console.error(err)
        res.status(500).send('error')
    }
})


module.exports = router