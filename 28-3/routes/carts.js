var express = require("express");
var router = express.Router();
const { CheckLogin } = require("../utils/authHandler");
let cartModel = require('../schemas/carts')
let inventoryModel = require('../schemas/inventories')

//get

router.get('/', CheckLogin, async function (req, res, next) {
    let user = req.user;
    let cart = await cartModel.findOne({
        user: user.id
    })
    res.send(cart.products)
})
//add
router.post('/add', CheckLogin, async function (req, res, next) {
    let user = req.user;
    let cart = await cartModel.findOne({
        user: user.id
    })
    let products = cart.products
    let productId = req.body.product;
    let getProduct = await inventoryModel.findOne({
        product: productId
    })
    if (!getProduct) {
        res.status(404).send({
            message: "san pham khong ton tai"
        })
        return;
    }
    let index = products.findIndex(function (f) {
        return f.product == productId
    })
    if (index < 0) {
        if (getProduct.stock < 1) {
            res.status(404)
                .send("ton kho khong du")
            return
        }
        products.push({
            product: productId,
            quantity: 1
        })
    } else {
        if (getProduct.stock <  (products[index].quantity + 1)) {
            res.status(404)
                .send("ton kho khong du")
            return
        }
        products[index].quantity += 1
    }

    await cart.save();
    res.send(cart)
})
//remove
router.post('/remove', CheckLogin, async function (req, res, next) {
    let user = req.user;
    let cart = await cartModel.findOne({
        user: user.id
    })
    let products = cart.products
    let productId = req.body.product;
    let getProduct = await inventoryModel.findOne({
        product: productId
    })
    if (!getProduct) {
        res.status(404).send({
            message: "san pham khong ton tai"
        })
        return;
    }
    let index = products.findIndex(function (f) {
        return f.product == productId
    })
    if (index < 0) {
        res.status(404).send({
            message: "san pham khong ton tai trong gio hang"
        })
        return;
    } else {
        products.splice(index, 1)
    }

    await cart.save();
    res.send(cart)
})
//decrease
router.post('/decrease', CheckLogin, async function (req, res, next) {
    let user = req.user;
    let cart = await cartModel.findOne({
        user: user.id
    })
    let products = cart.products
    let productId = req.body.product;
    let getProduct = await inventoryModel.findOne({
        product: productId
    })
    if (!getProduct) {
        res.status(404).send({
            message: "san pham khong ton tai"
        })
        return;
    }
    let index = products.findIndex(function (f) {
        return f.product == productId
    })
    if (index < 0) {
        res.status(404).send({
            message: "san pham khong ton tai trong gio hang"
        })
        return;
    } else {
        if (products[index].quantity == 1) {
            products.splice(index, 1)
        } else {
            products[index].quantity -= 1
        }
    }

    await cart.save();
    res.send(cart)
})
//modify
router.post('/modify', CheckLogin, async function (req, res, next) {
    let user = req.user;
    let cart = await cartModel.findOne({
        user: user.id
    })
    let products = cart.products
    let productId = req.body.product;
    let quantity = req.body.quantity;
    let getProduct = await inventoryModel.findOne({
        product: productId
    })
    if (!getProduct) {
        res.status(404).send({
            message: "san pham khong ton tai"
        })
        return;
    }
    let index = products.findIndex(function (f) {
        return f.product == productId
    })
    if (index < 0) {
        res.status(404).send({
            message: "san pham khong ton tai trong gio hang"
        })
        return;
    } else {
        products[index].quantity = quantity;
        if (products[index].quantity == 0) {
            products.splice(index, 1)
        }
    }

    await cart.save();
    res.send(cart)
})

module.exports = router;