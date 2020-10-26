const mongoose = require("mongoose")
const validator = require("validator")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const geocode = require("../utils/geocode")
const Item = require("../models/item")


const userSchema = new mongoose.Schema({
    name: {
        required: true, 
        type: String, 
        trim: true
    }, 
    email: {
        required: true, 
        type: String, 
        trim: true, 
        unique: true,
        lowercase: true, 
        validate(value){   
            if(!validator.isEmail(value)){
                throw new Error("Invalid email address!")
            }
        }
    }, 
    password: {
        required: true, 
        type: String,
        trim: true, 
        minlength: 8, 
        validate(value){
            const specialchar = [".", "_", "-", "%", "@", "#", "!"]
            if (!specialchar.some(elem => value.toLowerCase().includes(elem))){
                throw new Error("Invalid password!")
            }
        } 
    }, 
    address: {
        required: true,
        type: String,
        trim: true
    },
    coordinates: {
        longitude: {
            type: Number
        }, 
        latitude: {
            type: Number
        }
    },
    onshopping: {
        default: false,
        type: Boolean
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
}, {
    timestamps: true
})

userSchema.virtual("items", {
    ref: "Item", 
    localField: "_id", 
    foreignField: "owner"
})

userSchema.methods.generateAuthToken = async function() {
    const user = this

    const token = jwt.sign({_id: user._id.toString()}, process.env.JWT_SECRET)

    user.tokens = user.tokens.concat({token})

    await user.save()

    return token
}

userSchema.methods.toJSON = function() {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    
    return userObject
}


userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email})
    
    if (!user) {
        throw new Error("Unable to login")
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error("Unable to login")
    }

    return user
}


userSchema.statics.findNeighbors = async (lon, lat, id) => {
    const deg2rad = (deg) => {
        return deg * (Math.PI/180)
    }

    const getDistance = (lon2, lat2) => {
        const R = 6371
        const dLat = deg2rad(lat2 - lat)
        const dLon = deg2rad(lon2 - lon)
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(deg2rad(lat)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        const d = R * c
        return d
    }

    let users = await User.find({_id: {$ne : id}})

    users = users.filter((user) => {
        const d = getDistance(user.coordinates.longitude, user.coordinates.latitude)
        return d <= 5 // find neighbors who live within 5km
    })

    return users
}


userSchema.pre("save", async function(next) {
    const user = this

    // Hash the plain text password before saving
    if (user.isModified("password")) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    // Obtain coordinates from address
    if (user.isModified("address")) {
        const coordinates = await geocode(user.address)
        user.coordinates.longitude = coordinates.longitude
        user.coordinates.latitude = coordinates.latitude
    }

    next()
})

// Delete user items when user is removed
userSchema.pre("remove", async function(next) {
    const user = this
    await Item.deleteMany({owner: user._id})

    next()
})

const User = mongoose.model("User", userSchema)

module.exports = User

