const sgMail = require("@sendgrid/mail")

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendToNeighbors = (email, name, items) => {
    sgMail.send({
        to: email,
        from: process.env.MYEMAIL, 
        subject: `Hi ${name}! Your neighbor is on shopping now!`, 
        text: `You have following items in your shopping list: ${items}`
    })
}


const sendToShopper = (email, name, items) => {
    sgMail.send({
        to: email, 
        from: process.env.MYEMAIL, 
        subject: `Hi ${name}! Your neighbors are waiting for shopping items!`, 
        text: `Here are the list of items: ${items}`
    })
}

module.exports = {
    sendToNeighbors, 
    sendToShopper
}