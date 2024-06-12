const express = require('express')
const { checkAuth } = require('../controllers/authMiddleware')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const nodemailer = require("nodemailer")
const ExcelJS = require("exceljs")
const Admin = require('../models/Admin')
const Complaint = require('../models/Complaint')

const router = express.Router()

function isDateBetween(dateStr, startStr, endStr) {
    let parts = startStr.split('-')
    const date = new Date(dateStr).setHours(0, 0, 0, 0)
    const startDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
    parts = endStr.split('-')
    const endDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))

    return date >= startDate && date <= endDate;
}

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
.get('/sendreport', async (req, res) => {
    const admin = await Admin.findByPk(1)
    const mail_list = [admin.registrar_email, admin.vc_email, admin.ppd_director_email]

    mail_list.map(async (email) => {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'your_email@example.com', // Replace with your email
                pass: 'your_email_password' // Replace with your email password
            }
        });
        let mailOptions = {
            from: 'MMS@gmail.com',
            to: email,
            subject: 'Generated Complaints Report',
            text: 'Attached is the complaints report.',
            attachments: [
                {
                    filename: 'Generated-Reports.xlsx',
                    path: filePath
                }
            ]
        };

        await transporter.sendMail(mailOptions)
    })
})
.get('/download', checkAuth, async (req, res) => {
    res.download('Generated-Reports.xlsx')
})
.post('/generatereport', checkAuth, async (req, res) => {
    // receives parameters like date range, whether to send the report or not
    // whether to include finished, in progress, just received or all complaint types
    const {send_report, date_range, include_done, include_progress, include_received, include_all, electrical, carpentry, facility} = req.body
    const all_complaints = await Complaint.findAll()

    const validcomplaints = all_complaints.map((complaint) => {
        if(include_all){
            if(date_range !== null){
                if(isDateBetween(complaint.start_date, date_range.start, date_range.stop)){
                    return {complaint_id: complaint.complaint_id, studentid: complaint.studentid, studentname: complaint.studentname, 
                        building: complaint.building, category: complaint.category, item: complaint.item, location: complaint.location, 
                        status: complaint.status, start_date: complaint.start_date, complete_date: complaint.complete_date
                    }
                }
            }
            else{
                return {complaint_id: complaint.complaint_id, studentid: complaint.studentid, studentname: complaint.studentname, 
                    building: complaint.building, category: complaint.category, item: complaint.item, location: complaint.location, 
                    status: complaint.status, start_date: complaint.start_date, complete_date: complaint.complete_date
                }
            }
        }
        else{
            if(electrical && complaint.category === 'electrical'){
                if(include_done){
                    if(date_range !== null){
                        if(isDateBetween(complaint.start_date, date_range.start, date_range.stop)){
                            if(complaint.status === 'done'){
                                return {complaint_id: complaint.complaint_id, studentid: complaint.studentid, studentname: complaint.studentname, 
                                    building: complaint.building, category: complaint.category, item: complaint.item, location: complaint.location, 
                                    status: complaint.status, start_date: complaint.start_date, complete_date: complaint.complete_date
                                }
                            }
                        }
                    }
                    else{
                        if(complaint.status === 'done'){
                            return {complaint_id: complaint.complaint_id, studentid: complaint.studentid, studentname: complaint.studentname, 
                                building: complaint.building, category: complaint.category, item: complaint.item, location: complaint.location, 
                                status: complaint.status, start_date: complaint.start_date, complete_date: complaint.complete_date
                            }
                        }
                    }
                }
                if(include_progress){
                    if(date_range !== null){
                        if(isDateBetween(complaint.start_date, date_range.start, date_range.stop)){
                            if(complaint.status === 'in progress'){
                                return {complaint_id: complaint.complaint_id, studentid: complaint.studentid, studentname: complaint.studentname, 
                                    building: complaint.building, category: complaint.category, item: complaint.item, location: complaint.location, 
                                    status: complaint.status, start_date: complaint.start_date, complete_date: complaint.complete_date
                                }
                            }
                        }
                    }
                    else{
                        if(complaint.status === 'in progress'){
                            return {complaint_id: complaint.complaint_id, studentid: complaint.studentid, studentname: complaint.studentname, 
                                building: complaint.building, category: complaint.category, item: complaint.item, location: complaint.location, 
                                status: complaint.status, start_date: complaint.start_date, complete_date: complaint.complete_date
                            }
                        }
                    }
                }
                if(include_received){
                    if(date_range !== null){
                        if(isDateBetween(complaint.start_date, date_range.start, date_range.stop)){
                            if(complaint.status === 'received'){
                                return {complaint_id: complaint.complaint_id, studentid: complaint.studentid, studentname: complaint.studentname, 
                                    building: complaint.building, category: complaint.category, item: complaint.item, location: complaint.location, 
                                    status: complaint.status, start_date: complaint.start_date, complete_date: complaint.complete_date
                                }
                            }
                        }
                    }
                    else{
                        if(complaint.status === 'received'){
                            return {complaint_id: complaint.complaint_id, studentid: complaint.studentid, studentname: complaint.studentname, 
                                building: complaint.building, category: complaint.category, item: complaint.item, location: complaint.location, 
                                status: complaint.status, start_date: complaint.start_date, complete_date: complaint.complete_date
                            }
                        }
                    }
                }
            }
            if(carpentry && complaint.category === 'carpentry'){
                if(include_done){
                    if(date_range !== null){
                        if(isDateBetween(complaint.start_date, date_range.start, date_range.stop)){
                            if(complaint.status === 'done'){
                                return {complaint_id: complaint.complaint_id, studentid: complaint.studentid, studentname: complaint.studentname, 
                                    building: complaint.building, category: complaint.category, item: complaint.item, location: complaint.location, 
                                    status: complaint.status, start_date: complaint.start_date, complete_date: complaint.complete_date
                                }
                            }
                        }
                    }
                    else{
                        if(complaint.status === 'done'){
                            return {complaint_id: complaint.complaint_id, studentid: complaint.studentid, studentname: complaint.studentname, 
                                building: complaint.building, category: complaint.category, item: complaint.item, location: complaint.location, 
                                status: complaint.status, start_date: complaint.start_date, complete_date: complaint.complete_date
                            }
                        }
                    }
                }
                if(include_progress){
                    if(date_range !== null){
                        if(isDateBetween(complaint.start_date, date_range.start, date_range.stop)){
                            if(complaint.status === 'in progress'){
                                return {complaint_id: complaint.complaint_id, studentid: complaint.studentid, studentname: complaint.studentname, 
                                    building: complaint.building, category: complaint.category, item: complaint.item, location: complaint.location, 
                                    status: complaint.status, start_date: complaint.start_date, complete_date: complaint.complete_date
                                }
                            }
                        }
                    }
                    else{
                        if(complaint.status === 'in progress'){
                            return {complaint_id: complaint.complaint_id, studentid: complaint.studentid, studentname: complaint.studentname, 
                                building: complaint.building, category: complaint.category, item: complaint.item, location: complaint.location, 
                                status: complaint.status, start_date: complaint.start_date, complete_date: complaint.complete_date
                            }
                        }
                    }
                }
                if(include_received){
                    if(date_range !== null){
                        if(isDateBetween(complaint.start_date, date_range.start, date_range.stop)){
                            if(complaint.status === 'received'){
                                return {complaint_id: complaint.complaint_id, studentid: complaint.studentid, studentname: complaint.studentname, 
                                    building: complaint.building, category: complaint.category, item: complaint.item, location: complaint.location, 
                                    status: complaint.status, start_date: complaint.start_date, complete_date: complaint.complete_date
                                }
                            }
                        }
                    }
                    else{
                        if(complaint.status === 'received'){
                            return {complaint_id: complaint.complaint_id, studentid: complaint.studentid, studentname: complaint.studentname, 
                                building: complaint.building, category: complaint.category, item: complaint.item, location: complaint.location, 
                                status: complaint.status, start_date: complaint.start_date, complete_date: complaint.complete_date
                            }
                        }
                    }
                }
            }
            if(facility && complaint.category === 'facilities'){
                if(include_done){
                    if(date_range !== null){
                        if(isDateBetween(complaint.start_date, date_range.start, date_range.stop)){
                            if(complaint.status === 'done'){
                                return {complaint_id: complaint.complaint_id, studentid: complaint.studentid, studentname: complaint.studentname, 
                                    building: complaint.building, category: complaint.category, item: complaint.item, location: complaint.location, 
                                    status: complaint.status, start_date: complaint.start_date, complete_date: complaint.complete_date
                                }
                            }
                        }
                    }
                    else{
                        if(complaint.status === 'done'){
                            return {complaint_id: complaint.complaint_id, studentid: complaint.studentid, studentname: complaint.studentname, 
                                building: complaint.building, category: complaint.category, item: complaint.item, location: complaint.location, 
                                status: complaint.status, start_date: complaint.start_date, complete_date: complaint.complete_date
                            }
                        }
                    }
                }
                if(include_progress){
                    if(date_range !== null){
                        if(isDateBetween(complaint.start_date, date_range.start, date_range.stop)){
                            if(complaint.status === 'in progress'){
                                return {complaint_id: complaint.complaint_id, studentid: complaint.studentid, studentname: complaint.studentname, 
                                    building: complaint.building, category: complaint.category, item: complaint.item, location: complaint.location, 
                                    status: complaint.status, start_date: complaint.start_date, complete_date: complaint.complete_date
                                }
                            }
                        }
                    }
                    else{
                        if(complaint.status === 'in progress'){
                            return {complaint_id: complaint.complaint_id, studentid: complaint.studentid, studentname: complaint.studentname, 
                                building: complaint.building, category: complaint.category, item: complaint.item, location: complaint.location, 
                                status: complaint.status, start_date: complaint.start_date, complete_date: complaint.complete_date
                            }
                        }
                    }
                }
                if(include_received){
                    if(date_range !== null){
                        if(isDateBetween(complaint.start_date, date_range.start, date_range.stop)){
                            if(complaint.status === 'received'){
                                return {complaint_id: complaint.complaint_id, studentid: complaint.studentid, studentname: complaint.studentname, 
                                    building: complaint.building, category: complaint.category, item: complaint.item, location: complaint.location, 
                                    status: complaint.status, start_date: complaint.start_date, complete_date: complaint.complete_date
                                }
                            }
                        }
                    }
                    else{
                        if(complaint.status === 'received'){
                            return {complaint_id: complaint.complaint_id, studentid: complaint.studentid, studentname: complaint.studentname, 
                                building: complaint.building, category: complaint.category, item: complaint.item, location: complaint.location, 
                                status: complaint.status, start_date: complaint.start_date, complete_date: complaint.complete_date
                            }
                        }
                    }
                }
            }
            if(!electrical && !facility && !carpentry){
                if(include_done){
                    if(date_range !== null){
                        if(isDateBetween(complaint.start_date, date_range.start, date_range.stop)){
                            if(complaint.status === 'done'){
                                return {complaint_id: complaint.complaint_id, studentid: complaint.studentid, studentname: complaint.studentname, 
                                    building: complaint.building, category: complaint.category, item: complaint.item, location: complaint.location, 
                                    status: complaint.status, start_date: complaint.start_date, complete_date: complaint.complete_date
                                }
                            }
                        }
                    }
                    else{
                        if(complaint.status === 'done'){
                            return {complaint_id: complaint.complaint_id, studentid: complaint.studentid, studentname: complaint.studentname, 
                                building: complaint.building, category: complaint.category, item: complaint.item, location: complaint.location, 
                                status: complaint.status, start_date: complaint.start_date, complete_date: complaint.complete_date
                            }
                        }
                    }
                }
                if(include_progress){
                    if(date_range !== null){
                        if(isDateBetween(complaint.start_date, date_range.start, date_range.stop)){
                            if(complaint.status === 'in progress'){
                                return {complaint_id: complaint.complaint_id, studentid: complaint.studentid, studentname: complaint.studentname, 
                                    building: complaint.building, category: complaint.category, item: complaint.item, location: complaint.location, 
                                    status: complaint.status, start_date: complaint.start_date, complete_date: complaint.complete_date
                                }
                            }
                        }
                    }
                    else{
                        if(complaint.status === 'in progress'){
                            return {complaint_id: complaint.complaint_id, studentid: complaint.studentid, studentname: complaint.studentname, 
                                building: complaint.building, category: complaint.category, item: complaint.item, location: complaint.location, 
                                status: complaint.status, start_date: complaint.start_date, complete_date: complaint.complete_date
                            }
                        }
                    }
                }
                if(include_received){
                    if(date_range !== null){
                        if(isDateBetween(complaint.start_date, date_range.start, date_range.stop)){
                            if(complaint.status === 'received'){
                                return {complaint_id: complaint.complaint_id, studentid: complaint.studentid, studentname: complaint.studentname, 
                                    building: complaint.building, category: complaint.category, item: complaint.item, location: complaint.location, 
                                    status: complaint.status, start_date: complaint.start_date, complete_date: complaint.complete_date
                                }
                            }
                        }
                    }
                    else{
                        if(complaint.status === 'received'){
                            return {complaint_id: complaint.complaint_id, studentid: complaint.studentid, studentname: complaint.studentname, 
                                building: complaint.building, category: complaint.category, item: complaint.item, location: complaint.location, 
                                status: complaint.status, start_date: complaint.start_date, complete_date: complaint.complete_date
                            }
                        }
                    }
                }
            }
        }
    })

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Complaints');

    worksheet.columns = [
        { header: 'Complaint ID', key: 'complaint_id', width: 15 },
        { header: 'Student ID', key: 'studentid', width: 15 },
        { header: 'Student Name', key: 'studentname', width: 25 },
        { header: 'Building', key: 'building', width: 20 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Item', key: 'item', width: 20 },
        { header: 'Location', key: 'location', width: 20 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Start Date', key: 'start_date', width: 15 },
        { header: 'Complete Date', key: 'complete_date', width: 15 }
    ];

    validcomplaints.forEach(complaint => {
        if(complaint){
            worksheet.addRow(complaint);
        }
    });

    const filePath = 'Generated-Reports.xlsx';
    workbook.xlsx.writeFile(filePath)
    .then(async () => {
        console.log(`File saved to ${filePath}`);

    })
    .catch(err => {
        console.error(`Error saving file: ${err}`);
    });
    
    
    if(send_report){
        const url = req.protocol + '://' + req.get('host')
        const response = await axios.get(`${url}/admin/sendreport`)
    }

    console.log(req.body, validcomplaints)


    res.json({status: 'ok', data: validcomplaints})

    // after generating, use "sendreport" route to send if option available.

    // send generated json back to frontend
})
.post('/updatestatus', checkAuth, async (req, res) => {
    try{
        const {complaint_id, status} = req.body

        const complaint = await Complaint.findOne({where: {complaint_id: complaint_id}})

        complaint.status = status
        await complaint.update({status: status})
        await complaint.save()

        res.json({status: 'ok'})
    }
    catch(e){
        console.error(e)
        res.json({status: 'fail'})
    }
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
                const token = jwt.sign({username: user.username, admin: true}, process.env.ACCESS_KEY, {expiresIn: '1d'})
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