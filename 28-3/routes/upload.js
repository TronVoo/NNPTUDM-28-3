var express = require("express");
var router = express.Router();
let { uploadImage, uploadExcel } = require('../utils/uploadHandler')
let path = require('path')
let exceljs = require('exceljs')
let categoryModel = require('../schemas/categories')
let productModel = require('../schemas/products')
let inventoryModel = require('../schemas/inventories')
let mongoose = require('mongoose')
let slugify = require('slugify')
let crypto = require('crypto')
let userModel = require('../schemas/users')
let roleModel = require('../schemas/roles')
let { sendWelcomeEmail } = require('../utils/mailHandler')

router.get('/:filename', function (req, res, next) {
    let pathFile = path.join(__dirname, '../uploads', req.params.filename)
    res.sendFile(pathFile)
})

router.post('/one_file', uploadImage.single('file'), function (req, res, next) {
    if (!req.file) {
        res.status(404).send({
            message: "file khong duoc de trong"
        })
        return
    }
    res.send({
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size
    })
})
router.post('/multiple_file', uploadImage.array('files'), function (req, res, next) {
    if (!req.files) {
        res.status(404).send({
            message: "file khong duoc de trong"
        })
        return
    }
    res.send(req.files.map(f => {
        return {
            filename: f.filename,
            path: f.path,
            size: f.size
        }
    }))
})
router.post('/excel', uploadExcel.single('file'), async function (req, res, next) {
    //workbook->worksheet->row/column->cell
    let workbook = new exceljs.Workbook();
    let pathFile = path.join(__dirname, '../uploads', req.file.filename)
    await workbook.xlsx.readFile(pathFile);
    let worksheet = workbook.worksheets[0];
    let categories = await categoryModel.find({});
    let categoryMap = new Map()
    for (const category of categories) {
        categoryMap.set(category.name, category._id)
    }
    let products = await productModel.find({});
    let getTitle = products.map(p => p.title)
    let getSku = products.map(p => p.sku)
    let result = [];
    for (let row = 2; row <= worksheet.rowCount; row++) {
        let errorsInRow = [];
        const contentRow = worksheet.getRow(row);
        let sku = contentRow.getCell(1).value;
        let title = contentRow.getCell(2).value;
        let category = contentRow.getCell(3).value;
        let price = Number.parseInt(contentRow.getCell(4).value);
        let stock = Number.parseInt(contentRow.getCell(5).value);
        if (price < 0 || isNaN(price)) {
            errorsInRow.push("price pahi la so duong")
        }
        if (stock < 0 || isNaN(stock)) {
            errorsInRow.push("stock pahi la so duong")
        }
        if (!categoryMap.has(category)) {
            errorsInRow.push("category khong hop le")
        }
        if (getTitle.includes(title)) {
            errorsInRow.push("Title da ton tai")
        }
        if (getSku.includes(sku)) {
            errorsInRow.push("sku da ton tai")
        }
        if (errorsInRow.length > 0) {
            result.push(errorsInRow)
            continue;
        }
        let session = await mongoose.startSession();
        session.startTransaction()
        try {
            let newProduct = new productModel({
                sku: sku,
                title: title,
                slug: slugify(title,
                    {
                        replacement: '-',
                        remove: undefined,
                        lower: true,
                        trim: true
                    }
                ), price: price,
                description: title,
                category: categoryMap.get(category)
            })
            await newProduct.save({ session });

            let newInventory = new inventoryModel({
                product: newProduct._id,
                stock: stock
            })
            await newInventory.save({ session });
            await newInventory.populate('product')
            await session.commitTransaction()
            await session.endSession()
            getTitle.push(newProduct.title)
            getSku.push(newProduct.sku)
            result.push(newInventory)
        } catch (error) {
            await session.abortTransaction()
            await session.endSession()
            result.push(error.message)
        }

    }
    res.send(result)
})

// Import users từ file Excel: cột 1 = username, cột 2 = email
router.post('/import-users', function (req, res, next) {
    uploadExcel.single('file')(req, res, function (err) {
        if (err) {
            return res.status(400).send({ message: 'Lỗi upload: ' + err.message })
        }
        if (!req.file) {
            return res.status(400).send({ message: 'Vui lòng upload file Excel (.xlsx)' })
        }
        next()
    })
}, async function (req, res, next) {

    // Tìm role 'user' (không phân biệt hoa thường)
    let userRole = await roleModel.findOne({
        name: { $regex: /^user$/i },
        isDeleted: false
    })
    if (!userRole) {
        return res.status(400).send({
            message: 'Không tìm thấy role "user" trong hệ thống. Hãy tạo role user trước khi import.'
        })
    }

    let workbook = new exceljs.Workbook()
    let pathFile = path.join(__dirname, '../uploads', req.file.filename)
    await workbook.xlsx.readFile(pathFile)
    let worksheet = workbook.worksheets[0]

    let result = []

    for (let row = 2; row <= worksheet.rowCount; row++) {
        let contentRow = worksheet.getRow(row)
        let username = contentRow.getCell(1).text
        // .text tự extract chuỗi đúng kể cả khi cell là hyperlink object
        let email = contentRow.getCell(2).text
        // Xử lý trường hợp hyperlink dạng mailto:user@example.com
        if (email.startsWith('mailto:')) {
            email = email.slice(7)
        }

        if (!username || !email) {
            result.push({ row, status: 'error', message: 'username hoặc email bị trống' })
            continue
        }

        username = String(username).trim()
        email = String(email).trim().toLowerCase()

        // Kiểm tra trùng lặp
        let existingUser = await userModel.findOne({ $or: [{ username }, { email }] })
        if (existingUser) {
            result.push({ row, username, email, status: 'error', message: 'username hoặc email đã tồn tại' })
            continue
        }

        // Sinh mật khẩu ngẫu nhiên 16 ký tự
        let plainPassword = crypto.randomBytes(12).toString('base64').slice(0, 16)

        try {
            let newUser = new userModel({
                username,
                email,
                // userSchema.pre('save') sẽ tự hash password
                password: plainPassword,
                role: userRole._id,
                status: true
            })
            await newUser.save()

            // Gửi email chứa thông tin đăng nhập (không ảnh hưởng việc tạo user)
            let emailStatus = 'sent'
            try {
                await sendWelcomeEmail(email, username, plainPassword)
            } catch (mailErr) {
                console.error('[import-users] Lỗi gửi mail tới', email, ':', mailErr.message)
                emailStatus = 'mail_failed: ' + mailErr.message
            }

            result.push({ row, username, email, status: 'success', emailStatus })
        } catch (error) {
            result.push({ row, username, email, status: 'error', message: error.message })
        }
    }

    res.send(result)
})

module.exports = router