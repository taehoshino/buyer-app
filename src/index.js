const express = require("express")
const userRouter = require("./routers/user")
const itemRouter = require("./routers/item")
require("./db/mongoose")

const app = express()
const port = process.env.PORT

app.use(express.json())
app.use(userRouter)
app.use(itemRouter)


app.listen(port, ()=>{
    console.log("Server is on port " + port)
})
