const express = require('express')
const app = express();
const path = require('path')
const hbs = require('hbs')

const templatePath=path.join(__dirname,'../templates')

app.use(express.json())
// to read from template
app.set('view engine','hbs')
app.set("views" , templatePath)
// app.use('/public', express.static(path.join(__dirname, 'public')))

app.get('/',(req,res)=>{
    res.render('login')
})

app.get('/signup',(req,res)=>{
    res.render('login')
})

app.listen(3000 , ()=>{
    console.log("server is running on port 3000")
})
