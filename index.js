const express = require('express')
const cors = require('cors')

const adminRoute = require('./routes/adminRoute')
const studentRoute = require('./routes/studentRoute')
const authStudentRoute = require('./routes/authStudentRoute')
const { end_of_month_report, send_periodic_report, REPORT_PERIOD } = require('./controllers/utilityfunctions')

require('dotenv').config()


const app = express()

app.use(cors())
app.use(express.urlencoded({extended: true}))
app.use(express.json())

app.use('/admin', cors(), adminRoute)
app.use('/student', cors(), studentRoute)
app.use('/auth/student', cors(), authStudentRoute)

setInterval(() => end_of_month_report(), (24 * 60 * 60 * 10))
setInterval(() => send_periodic_report, REPORT_PERIOD)

app.get("*", (req, res) => {
    res.send("Error")
})

app.listen(process.env.PORT)