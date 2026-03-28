let mongoose = require('mongoose')
let productSchema = mongoose.Schema({
    sku: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true,
        unique: true
    }, slug: {
        type: String,
        unique: true
    }, price: {
        type: Number,
        min: 0
    },
    description: {
        type: String,
        default: ""
    },
    images: {
        type: [String],
        default: ["https://placehold.co/600x400"]
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category',
        required: true
    }

}, {
    timestamps: true
})
module.exports = new mongoose.model('product', productSchema)