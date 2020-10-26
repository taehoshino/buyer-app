const express = require("express")
const Item = require("../models/item")
const auth = require("../middleware/auth")

const router = new express.Router()

router.post("/items", auth, async (req, res) => {
    const item = new Item({
        ...req.body, 
        owner: req.user._id
    })

    try {
        await item.save()        
        res.status(201).send(item)

    } catch(e) {
        res.status(400).send(e)
    }
})

// GET /items?completed=false
// GET /items?sortBy=createdAt:desc
router.get("/items", auth, async (req, res) => {
    const match = {}
    const sort = {}

    if(req.query.completed) {
        match.completed = req.query.completed === "true"
    }

    if(req.query.sortBy) {
        const parts = req.query.sortBy.split(":")
        sort[parts[0]] = parts[1] === "desc" ? -1 : 1
    }

//https://mongoosejs.com/docs/api.html#model_Model.populate

    try {
        await req.user.populate({
            path: "items", 
            match, 
            options: {
                sort
            }
        }).execPopulate()
        
        res.send(req.user.items)

    } catch (e) {
        res.status(500).send()
    }

})

router.patch("/items/:id", auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = Object.keys(Item.schema.paths).filter((key)=>!key.includes("_"))
    const isValidOperation = updates.every((update)=>allowedUpdates.includes(update))
    if (!isValidOperation) {
        return res.status(400).send({error: "Invalid updates"})
    }

    try {
        const item = await Item.findOne({_id: req.params.id, owner: req.user._id})

        if (!item) {
            return res.status(404).send()
        }

        updates.forEach((update)=>item[update]=req.body[update])
        await item.save()
        res.send(item)


    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete("/items/:id", auth, async (req, res) => {
    try {
        const item = await Item.findOneAndDelete({_id: req.params.id, owner: req.user._id})
        if (!item) {
            res.status(404).send()
        }
        res.send(item)

    } catch (e) {   
        res.status(500).send()
    }
})



module.exports = router