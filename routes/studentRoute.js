const express = require('express')
const crypto = require('crypto')
const { checkAuth } = require('../controllers/authMiddleware')
const Complaint = require('../models/Complaint')


const router = express.Router()


router
.post('/addcomplaint', checkAuth, async (req, res) => {
    try{
        const { studentid, studentname, studentemail, building, category, item, location} = req.body
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
            studentname: studentname,
            studentemail: studentemail,
            building: building,
            category: category,
            item: item,
            location: location,
            status: 'received',
            start_date: start_date.toUTCString(),
            complete_date: ''
        })

        await new_complaint.save()
        res.json({status: 'ok'})
    }
    catch(e){
        console.error(e)
        res.json({status: 'fail', error: 'server error'})
    }
})


module.exports = router