const { DataTypes } = require('sequelize')
const sequelize = require('./connectDB')

const Admin = sequelize.define('Admin', {
    username: {
        type: DataTypes.STRING
    },
    password: {
        type: DataTypes.STRING
    },
    registrar_email: {
        type: DataTypes.STRING
    },
    vc_email: {
        type: DataTypes.STRING
    },
    ppd_director_email: {
        type: DataTypes.STRING
    },
})

Admin.sync()

module.exports = Admin