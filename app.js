const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const authRoute = require('./routes/authRoute')
const checkoute = require('./routes/checkRoute')
const monitoringRoute = require('./routes/monitoringRoute');

require("dotenv").config();

const MONGO_URI = `mongodb://${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`;

const app = express();

app.use(bodyParser.json());

app.get('/',(req,res,next)=>{
  res.status(200).json({
    message : "server is up"
  })
})

// authentication route
app.use('/auth',authRoute)

// check route 
app.use('/check',checkoute)

// start - stop monitoring 
app.use('/monitoring',monitoringRoute)


app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  res.status(status).json({
    message: message,
  });
});

mongoose
  .connect(MONGO_URI)
  .then(() =>
    app.listen(process.env.APPLICATION_PORT, () => {
      console.log(`Litening on port  ${process.env.APPLICATION_PORT}`);
    })
  )
  .catch((err) => console.log(err));
