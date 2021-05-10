require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose')
const User = require('./models/user')
const cors = require('cors');
const app = express()

app.use(cors());
app.use(express.urlencoded({extended: true})); 
app.use(express.json()); 

const dbURI = process.env.dbURI
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })
  .then((result)=>{ 
    app.listen(5000);
    console.log('connected to db')
  })
  .catch((err)=>console.log(err))
app.get('/', (req, res)=>{
  res.send('hello there')
})

app.get('/add-user', (req, res)=>{
  const user = new User({
    email: 'test@gmail.com',
    password: '123'
  })
  user.save()
  .then((result)=>{
    res.send(result)
  })
  .catch((err)=>{
    console.log(err)
  })
})

app.post('/signup', (req, res)=>{
  console.log(req.body)
  const {email, password} = req.body
  const user = new User({
    email, password
  })
  console.log(user)
  user.
  user.save()
  .then((result)=>{
    res.send(result)
  })
  .catch((err)=>{
    console.log(err)
  })
})
//List of all users
app.get('/users', (req, res)=>{
  User.find()
  .then((result=>res.send(result)))
  .catch((err)=>console.log(err))
})
//Spicific User
app.get('/users/:userId', (req, res)=>{
  User.findById(req.params.userId)
  .then((result)=>res.send(result))
  .catch((err)=>{
    console.log(err)
  })
})
//Add a workout
app.patch('/users/:userId', (req, res)=>{
  User.updateOne({_id:req.params.userId}, {$push:{
    workouts:req.body
  }})
  .then((result)=>res.send(result))
  .catch((err)=>{
    console.log(err)
  })
})
//List of workouts of a specific user
app.get('/users/:userId/workouts', (req, res)=>{
  User.findById(req.params.userId)
  .then((result)=>res.send(result.workouts))
  .catch((err)=>{
    console.log(err)
  })
})

//Get a specific workout
app.get('/users/:userId/workouts/:workoutId',async (req, res)=>{
  const user = await User.findById(req.params.userId)
  const workouts = user.workouts
  const workout = workouts.find(i=>i.id===req.params.workoutId)
  res.send(workout)
})

// Add an exercise to a workout
app.patch('/users/:userId/workouts/:workoutId', async (req, res)=>{

})


