var express = require('express');
var app = express();
app.use('/lab8', express.static('lab8'))
app.use('/lab7', express.static('lab7'))
app.use('/lab6', express.static('lab6'))
app.use('/lab5', express.static('lab5'))
app.use('/lab3', express.static('lab3'))
app.use('/lab2', express.static('lab2'))
app.use('/lab1', express.static('lab1'))
app.listen(3000)