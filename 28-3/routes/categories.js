var express = require('express');
var router = express.Router();
let slugify = require('slugify');
let categoryModel = require('../schemas/categories')

//R CUD
/* GET users listing. */
router.get('/', async function (req, res, next) {
  let data = await categoryModel.find({
    isDeleted: false
  })
  res.send(data);
});
router.get('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let result = await categoryModel.find({
      isDeleted: false,
      _id: id
    })
    if (result.length > 0) {
      res.send(result[0])
    } else {
      res.status(404).send("ID NOT FOUND")
    }
  } catch (error) {
    res.status(404).send(error.message)
  }

});

router.post('/', async function (req, res, next) {
  let newCate = new categoryModel({
    name: req.body.name,
    slug: slugify(req.body.name,
      {
        replacement: '-',
        remove: undefined,
        lower: true,
        trim: true
      }
    ),
    image: req.body.image
  })
  await newCate.save();
  res.send(newCate)
})
router.put('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    // let result = await categoryModel.findById(id)
    // let keys = Object.keys(req.body);
    // for (const key of keys) {
    //     result[key] = req.body[key]
    //     result.updatedAt = new Date(Date.now())
    // }
    // await result.save()
    let result = await categoryModel.findByIdAndUpdate(
      id, req.body, {
      new: true
    })
    res.send(result)
  } catch (error) {
    res.status(404).send(error.message)
  }
})
router.delete('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let result = await categoryModel.findById(id)
    result.isDeleted = true;
    await result.save()
    res.send(result)
  } catch (error) {
    res.status(404).send(error.message)
  }
})



module.exports = router;
