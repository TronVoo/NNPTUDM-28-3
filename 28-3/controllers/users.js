let userModel = require("../schemas/users");
module.exports = {
    CreateAnUser: async function (username, password, email, role,session,
        fullName, avatarUrl, status, loginCount
    ) {
        let newItem = new userModel({
            username: username,
            password: password,
            email: email,
            fullName: fullName,
            avatarUrl: avatarUrl,
            status: status,
            role: role,
            loginCount: loginCount
        });
        await newItem.save({session});
        return newItem; 
    },
    GetAllUser: async function () {
        let users = await userModel
            .find({ isDeleted: false })
        return users;
    },
    GetAnUserByUsername: async function (username) {
        let user = await userModel
            .findOne({
                isDeleted: false,
                username: username
            })
        return user;
    },
    GetAnUserByEmail: async function (email) {
        let user = await userModel
            .findOne({
                isDeleted: false,
                email: email
            })
        return user;
    },
    GetAnUserByToken: async function (token) {
        let user = await userModel
            .findOne({
                isDeleted: false,
                forgotPasswordToken: token
            })
        if (user && user.forgotPasswordTokenExp > Date.now()) {
            return user;
        } else {
            return false;
        }

    },
    GetAnUserById: async function (id) {
        let user = await userModel
            .findOne({
                isDeleted: false,
                _id: id
            }).populate('role')
        return user;
    }

}