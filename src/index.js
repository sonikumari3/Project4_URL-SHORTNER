// IMPORT EXPRESS PACKAGE( COMMOM JS SYNTEX )------
const express = require('express')

// INSTATIATE THE EXPRESS APP------
const app = express()

//IMPORT BODY PARESR PACKAGE-----
const bodyParser = require('body-parser')

// IMPORT ROUTE MODULE------
const route = require('./routes/route');
const mongoose = require('mongoose');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended:true }));

// DECLARE  A DATABASE STRING URL----
mongoose.connect('mongodb+srv://Soni1997:wgxWkp5sMqJNywe4@cluster0.phf7l.mongodb.net/group72Database',
{
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then( () => console.log("mongoDB is connected"))
.catch ( err => console.log(err))

// APP SET THEIR ENDPOINT IN ROUTE.JS----
app.use('/',route)

// LISTEN FOR INCOMING REQUESTS-----
app.listen(process.env.PORT || 3000, function (){
    console.log('Express app running on port' + (process.env.PORT || 3000))
})