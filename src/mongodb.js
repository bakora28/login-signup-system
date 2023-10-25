const mongoose = require('mongoose')
mongoose.connect('mongodb+srv://yara:123@cluster0.an7064r.mongodb.net/?retryWrites=true&w=majority')

// mongoose.connect('mongodb://localhost:27017/LoginSignUpTutorial')
    .then(() => {
        console.log('mongodb connected')
    })
    .catch(() => {
        console.log('failed to connect')
    })

const logInSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
})


const collection = new mongoose.model("Collection1", logInSchema)

module.exports = collection