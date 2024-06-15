const { Op } = require("sequelize")
const nodemailer = require("nodemailer")
const ExcelJS = require("exceljs")
const Complaint = require("../models/Complaint")
const Admin = require("../models/Admin")
require('dotenv').config()

const REPORT_PERIOD = 7 * 24 * 60 * 60 * 10
const SMALLER_INTERVALS = 1 * 24 * 60 * 60 * 10
const COMPLAINT_DEADLINE = 2 * 7 * 24 * 60 * 60 * 10


const send_periodic_report = async () => {
    // get all outstanding complaints. if none, just pass
    const all_complaints = await Complaint.findAll({where: {status: {[Op.not]: 'completed'}}})
    if(!all_complaints){
        return
    }
    const complaints = all_complaints.map((complaint) => {
        return {complaint_id: complaint.complaint_id, studentid: complaint.studentid, studentname: complaint.studentname, 
            building: complaint.building, category: complaint.category, item: complaint.item, location: complaint.location, 
            status: complaint.status, start_date: complaint.start_date, complete_date: complaint.complete_date, satisfaction: complaint.satisfaction
        }
    })

    // format and add to excel file
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

    complaints.forEach(complaint => {
        worksheet.addRow(complaint);
    });

    const filePath = 'Reports.xlsx';
    workbook.xlsx.writeFile(filePath)
    .then(async () => {
        console.log(`File saved to ${filePath}`);
        const admin = await Admin.findByPk(1)
        const mail_list = [admin.registrar_email, admin.vc_email, admin.ppd_director_email]

        mail_list.map(async (email) => {
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USERNAME, // Replace with your email
                    pass: process.env.EMAIL_PASSWORD // Replace with your email password
                }
            });
            let mailOptions = {
                from: 'MMS@gmail.com',
                to: email,
                subject: 'Complaints Report',
                text: 'Attached is the complaints report.',
                attachments: [
                    {
                        filename: 'Reports.xlsx',
                        path: filePath
                    }
                ]
            };

            await transporter.sendMail(mailOptions)
        })

    })
    .catch(err => {
        console.error(`Error saving file: ${err}`);
    });

    // send email to all people in loop with excel file as extension

}

const checkEscalate = async (complaint_id) => {
    // get complaint id
    const compaint = await Complaint.findOne({where: {complaint_id: complaint_id}})
    if(compaint.status === 'completed'){
        return
    }
    setInterval(() => escalate(complaint_id), SMALLER_INTERVALS)

    // set timeout function to check if complaint has been done within deadline.
    // if done, pass. if not, set interval function 
    // using the escalate function to send this complaint to VC email 
    // at smaller intervals
}

const escalate = async (complaint_id) => {
    // get complaint from complain id and send mail to VC
    const admin = await Admin.findByPk(1)
    const complaint = await Complaint.findOne({where: {complaint_id: complaint_id}})
    if(complaint.status === 'completed'){
        return
    }

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USERNAME, // Replace with your email
            pass: process.env.EMAIL_PASSWORD // Replace with your email password
        }
    });
    let mailOptions = {
        from: 'MMS@gmail.com',
        to: admin.vc_email,
        subject: 'Complaints Report',
        text: `This complaint has been unresolved for too long.\n
        Details: ${complaint.building}, ${complaint.location}, 
        ${complaint.category}, ${complaint.item}.\nReported by ${complaint.studentname} on ${complaint.start_date}`,
    };

    await transporter.sendMail(mailOptions)
}

const end_of_month_report = async () => {
    // function runs every 24 hrs
    // check month end first
    if(!check_month_end()){
        return
    }
    // get all complaints between the last 30 days
    const all_complaints = await Complaint.findAll()
    if(!all_complaints){
        return
    }

    const complaints = all_complaints.map((complaint) => {
        if(isDateInCurrentMonth(complaint.start_date)){
            return {complaint_id: complaint.complaint_id, studentid: complaint.studentid, studentname: complaint.studentname, 
                building: complaint.building, category: complaint.category, item: complaint.item, location: complaint.location, 
                status: complaint.status, start_date: complaint.start_date, complete_date: complaint.complete_date
            }
        }
    })

    console.log('COMPLAINTS: ', complaints)

    // format and add to excel file

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

    complaints.forEach(complaint => {
        worksheet.addRow(complaint);
    });

    const filePath = 'Monthly-Reports.xlsx';
    workbook.xlsx.writeFile(filePath)
    .then(async () => {
        console.log(`File saved to ${filePath}`);
        const admin = await Admin.findByPk(1)
        const mail_list = [admin.registrar_email, admin.vc_email, admin.ppd_director_email]

        mail_list.map(async (email) => {
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USERNAME, // Replace with your email
                    pass: process.env.EMAIL_PASSWORD // Replace with your email password
                }
            });
            let mailOptions = {
                from: 'MMS@gmail.com',
                to: email,
                subject: 'Monthly Complaints Report',
                text: 'Attached is the complaints report.',
                attachments: [
                    {
                        filename: 'Monthly-Reports.xlsx',
                        path: filePath
                    }
                ]
            };

            await transporter.sendMail(mailOptions)
        })

    })
    .catch(err => {
        console.error(`Error saving file: ${err}`);
    });

    // send email to all people in loop with excel file as extension
}

const check_month_end = () =>  {
    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return today.getDate() === lastDayOfMonth.getDate();
}

function isDateInCurrentMonth(dateString) {
    // Parse the input date string
    const inputDate = new Date(dateString);

    // Get the current date
    const currentDate = new Date();

    // Check if the year and month of the input date match the current date
    const isSameYear = inputDate.getFullYear() === currentDate.getFullYear();
    const isSameMonth = inputDate.getMonth() === currentDate.getMonth();

    return isSameYear && isSameMonth;
}

function isDateInPreviousMonth(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();

    // Calculate the previous month and year
    let previousMonth = now.getMonth() - 1;
    let year = now.getFullYear();

    if (previousMonth < 0) {
        previousMonth = 11; // December
        year -= 1;
    }

    // Create the start and end dates of the previous month
    const startOfPreviousMonth = new Date(year, previousMonth, 1);
    const endOfPreviousMonth = new Date(year, previousMonth + 1, 0, 23, 59, 59, 999);

    // Check if the given date falls within the previous month
    return date >= startOfPreviousMonth && date <= endOfPreviousMonth;
}


module.exports = {REPORT_PERIOD, SMALLER_INTERVALS, COMPLAINT_DEADLINE, send_periodic_report, checkEscalate, escalate, end_of_month_report}