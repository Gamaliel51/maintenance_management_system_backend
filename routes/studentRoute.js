const express = require('express')
const crypto = require('crypto')
const { checkAuth } = require('../controllers/authMiddleware')
const Complaint = require('../models/Complaint')
const Student = require('../models/student')
const { checkEscalate, COMPLAINT_DEADLINE } = require('../controllers/utilityfunctions')


const router = express.Router()

router
.get('/profile', checkAuth, async (req, res) => {
    try{
        if(!req.user){
            return res.json({status: 'fail', error: 'you are not logged in'})
        }
        const studentid = req.user.username
        const student = await Student.findOne({where: {studentid: studentid}})
        if(!student){
            return res.json({status: 'fail', error: 'No such student'})
        }

        const student_data = {studentname: student.studentname, studentemail: student.studentemail, gender: student.gender}

        res.json({status: 'ok', data: student_data})
    }
    catch(e){
        console.error(e)
        res.json({status: 'fail', error: 'server error'})
    }
})
.get('/getallcomplaints', checkAuth, async (req, res) => {
    const studentid = req.user.username

    const student = await Student.findOne({where: {studentid: studentid}})
    if(!student){
        return res.json({status: 'fail', error: 'No such student'})
    }

    const complaints = await Complaint.findAll({where: {studentid: studentid}})
    if(!complaints){
        return res.json({status: 'ok', data: []})
    }

    res.json({status: 'ok', data: complaints})
})
.get('/getdonecomplaints', checkAuth, async (req, res) => {
    const studentid = req.user.username

    const student = await Student.findOne({where: {studentid: studentid}})
    if(!student){
        return res.json({status: 'fail', error: 'No such student'})
    }

    const complaints = await Complaint.findAll({where: {studentid: studentid, status: 'completed'}})
    if(!complaints){
        return res.json({status: 'ok', data: []})
    }

    res.json({status: 'ok', data: complaints})
})
.post('/addcomplaint', checkAuth, async (req, res) => {
    try{
        const { building, category, item, location} = req.body

        const studentid = req.user.username

        const student = await Student.findOne({where: {studentid: studentid}})
        if(!student){
            return res.json({status: 'fail', error: 'No such student'})
        }

        let complaint_id_exist = true
        let complaint_id = crypto.randomUUID()
        const start_date = new Date()

        while(complaint_id_exist){
            complaint_id = crypto.randomUUID()
            complaint_id_exist = await Complaint.findOne({where: {complaint_id: complaint_id}})
        }

        const new_complaint = await Complaint.create({
            complaint_id: complaint_id,
            studentid: studentid,
            studentname: student.studentname,
            studentemail: student.studentemail,
            building: building,
            category: category,
            item: item,
            location: location,
            status: 'received',
            start_date: start_date.toUTCString(),
            complete_date: '',
            satisfaction: 'none'
        })

        await new_complaint.save()

        setTimeout(() => checkEscalate(complaint_id), COMPLAINT_DEADLINE)

        res.json({status: 'ok'})
    }
    catch(e){
        console.error(e)
        res.json({status: 'fail', error: 'server error'})
    }
})
.post('/comment', checkAuth, async (req, res) => {
    try{
        const {complaint_id, comment} = req.body
        const studentid = req.user.username

        const complaint = await Complaint.findOne({where: {complaint_id: complaint_id}})
        if(!complaint){
            res.json({status: 'fail', error: 'No such complaint record'})
        }

        complaint.satisfaction = comment
        await complaint.update({satisfaction: comment})
        await complaint.save()

        res.json({status: 'ok'})
    }
    catch(e){
        console.error(e)
        res.json({status: 'fail'})
    }
})

module.exports = router