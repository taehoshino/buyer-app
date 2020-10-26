const mongoose = require("mongoose")

const itemSchema = new mongoose.Schema({
    name: {
        type: String, 
        required: true, 
        trim: true
    }, 
    order: {
        type: Number, 
        default: 1
    }, 
    completed: {
        type: Boolean, 
        default: false
    }, 
    owner: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "User"
    }
}, {
    timestamps: true
})

itemSchema.methods.toJSON = function() {
    const item = this
    const itemObject = item.toObject()

    delete itemObject._id
    delete itemObject.owner
    delete itemObject.createdAt
    delete itemObject.updatedAt
    delete itemObject.__v

    return itemObject
}

const Item = mongoose.model("Item", itemSchema)

module.exports = Item