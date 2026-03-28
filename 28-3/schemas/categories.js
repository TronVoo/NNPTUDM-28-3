let mongoose = require('mongoose')
let categorySchema = mongoose.Schema({
    name: {
        type: String,
        requied: true,
        unique: [true, "trung ten"]
    },
    slug: {
        type: String,
        requied: true,
        unique: [true, "trung ten"]
    },
    image: {
        type: String,
        default: "https://placeimg.com/640/480/any"
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})
module.exports = new mongoose.model('category', categorySchema)