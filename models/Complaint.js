const { DataTypes } = require('sequelize')
const sequelize = require('./connectDB')

const Complaint = sequelize.define('Complaint', {
    complaint_id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    studentid: {
        type: DataTypes.STRING
    },
    studentname: {
        type: DataTypes.STRING
    },
    studentemail: {
        type: DataTypes.STRING
    },
    building: {                     // building where complaint is
        type: DataTypes.STRING
    },
    category: {                     // carpentry, electrical or educational facilities
        type: DataTypes.STRING
    },
    item: {
        type: DataTypes.STRING
    },
    location: {
        type: DataTypes.STRING
    },
    status: {                       // three states - received, in progress and completed
        type: DataTypes.STRING
    },
    start_date: {
        type: DataTypes.STRING
    },
    complete_date: {
        type: DataTypes.STRING
    }
})

Complaint.sync()

module.exports = Complaint