const express = require("express")
const User = require("../models/user")
const auth = require("../middleware/auth")
const {sendToNeighbors, sendToShopper} = require("../emails/notification")

const router = new express.Router()

router.post("/users", async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})

    } catch(e) {
        res.status(400).send(e)
    }

})

router.post("/users/login", async (req, res)=>{
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({user, token})

    } catch (e) {
        res.status(400).send()
    }
})

router.post("/users/logout", auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token)
        await req.user.save()
        res.send("Logged out successfully.")

    } catch (e) {
        res.status(500),send()
    }
})

router.post("/users/logoutALL", auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send("Logged out successfully.")

    } catch (e) {
        res.status(500).send()
    }
})

router.get("/users/me", auth, async (req, res) => {
    res.send(req.user)
})


router.patch("/users/me", auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ["name", "email", "password", "address"]
    const isValidOperation = updates.every((update)=>allowedUpdates.includes(update))
        
    if (!isValidOperation) {
        return res.status(400).send({error: "Invalid updates"})
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update])

        await req.user.save()
        res.send(req.user)

    } catch (e) {
        res.status(400).send(e)
    }    
})


// /users/me/shopping?on=true
router.patch("/users/me/shopping", auth, async (req, res) => {
    const onshopping = req.query.on === "true"

    if (onshopping && req.user.onshopping===false) {

        try {
            req.user.onshopping = true

            // find neighbors
            const neighbors = await User.findNeighbors(req.user.coordinates.longitude, req.user.coordinates.latitude, req.user._id) 
            
            // filter neighbors with items and send email 
            const sendEmail = async () => {
                var items_all = [] //list of all items to buy (concat items of each neighbor)

                await Promise.all(neighbors.map(async neighbor => {
                    await neighbor.populate({
                        path: "items", 
                        match: {
                            completed: false
                        }
                    }).execPopulate()

                    if (!(neighbor.items.length === 0)) {
                        items_all = items_all.concat(neighbor.items)
                        sendToNeighbors(neighbor.email, neighbor.name, JSON.stringify(neighbor.items))
                    }
                }))

                // send email to shopper
                sendToShopper(req.user.email, req.user.name, JSON.stringify(items_all))
            }

            await sendEmail()

            await req.user.save()
            res.send(req.user)

        } catch (e) {
            res.status(400).send(e)
        }

    } else {

        try {
            req.user.onshopping = req.query.on === "true"
            await req.user.save()
            res.send(req.user)
    
        } catch (e) {
            res.status(400).send(e)
        }
    }  


})

router.delete("/users/me", auth, async (req, res) => {
    try {
        await req.user.remove()
        res.send(req.user)

    } catch (e) {
        res.status(500).send(e)
    }
})

module.exports = router
