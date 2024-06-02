const { DataTypes } = require('sequelize')
const sequelize = require('./connectDB')

const Student = sequelize.define('Student', {
    studentid: {
        type: DataTypes.STRING
    },
    password: {
        type: DataTypes.STRING
    },
    studentname: {
        type: DataTypes.STRING
    },
    studentemail: {
        type: DataTypes.STRING
    },
    gender: {
        type: DataTypes.STRING
    },
})

Student.sync()

module.exports = Student