let multer = require('multer')
let path = require('path')

//luu o dau,luu file ten gi
let storageSetting = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        let ext = path.extname(file.originalname)
        let filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
        cb(null, filename)
    },
})
let filterImage = function (req, file, cb) {
    if (file.mimetype.startsWith("image")) {
        cb(null, true)
    } else {
        cb(new Error("file khong hop le"))
    }
}
let filterExcel = function (req, file, cb) {
    let ext = path.extname(file.originalname).toLowerCase()
    if (ext === ".xlsx") {
        cb(null, true)
    } else {
        cb(null, false)
    }
}
module.exports = {
    uploadImage: multer({
        storage: storageSetting,
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: filterImage
    }),
    uploadExcel: multer({
        storage: storageSetting,
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: filterExcel
    })
}