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
  user.save()
  .then((result)=>{
    res.send(result)
  })
  .catch((err)=>{
    console.log(err)
  })
})

app.post('/login', async (req, res)=>{
  const {email, password} = req.body
  const user = await User.findOne({email:email})
  if(user.password === password) {
    res.json(user)
  } else {
    res.status(400).json('wrong password')
  }
})


//List of all users
app.get('/users', (req, res)=>{
  User.find()
  .then((result=>res.send(result)))
  .catch((err)=>console.log(err))
})
//Specific User
app.get('/users/:userId', (req, res)=>{
  User.findById(req.params.userId)
  .then((result)=>res.send(result))
  .catch((err)=>{
    console.log(err)
  })
})
//Add a workout
app.post('/users/:userId/', (req, res)=>{
  User.updateOne({_id:req.params.userId}, {$push:{
    workouts:req.body
  }})
  .then((result)=>res.send(result))
  .catch((err)=>{
    console.log(err)
  })
})


//List of workouts of a specific user

app.get('/users/:userId/workouts', async (req, res)=>{
  const user = await User.findById(req.params.userId)
  const workouts= await user.workouts
  res.send(workouts)
})


//Get a specific workout
app.get('/users/:userId/workouts/:workoutId',async (req, res)=>{
  const user = await User.findById(req.params.userId)
  const workout = await user.workouts.id(req.params.workoutId)
  res.send(workout)
})


//Find all exercises
app.get('/users/:userId/workouts/:workoutId/exercise',async (req, res)=>{
  const user = await User.findById(req.params.userId)
  const exercises = await user.workouts.id(req.params.workoutId).exercise
  res.send(exercises)
})

//Find a specific exercise
app.get('/users/:userId/workouts/:workoutId/exercise/:exerciseId',async (req, res)=>{
  const user = await User.findById(req.params.userId)
  const exercises = await user.workouts.id(req.params.workoutId).exercise.id(req.params.exerciseId)
  res.send(exercises)
})

//Find a specific exercise
app.get('/users/:userId/workouts/:workoutId/exercise/:exerciseId',async (req, res)=>{
  const user = await User.findById(req.params.userId)
  const exercises = await user.workouts.id(req.params.workoutId).exercise.id(req.params.exerciseId).exercise
  res.send(exercises)
})

//Add an exercise
app.post('/users/:userId/workouts/:workoutId', async (req, res)=>{
  const user = await User.findById(req.params.userId)
  const workout = await user.workouts.id(req.params.workoutId)
  workout.exercise.push(req.body)
  user.save(function(err){
    if (err) return console.log('fuck')
    console.log('exercise succesfully added!')
  })
})

//delete a workout
app.delete('/users/:userId/workouts/:workoutId', async (req, res)=>{
  const user = await User.findById(req.params.userId)
  user.workouts.id(req.params.workoutId).remove()
  user.save(function(err){
    if (err) return console.log('fuck')
    console.log('workout succesfully deleted!')
  })
})
//delete an exercise
app.delete('/users/:userId/workouts/:workoutId/exercise/:exerciseId', async (req, res)=>{
  const user = await User.findById(req.params.userId)
  const workout = await user.workouts.id(req.params.workoutId)
  workout.exercise.id(req.params.exerciseId).remove()
  user.save(function(err){
    if (err) return console.log('fuck')
    console.log('exercise succesfully deleted!')
  })
})

//update a workout
app.patch('/users/:userId/workouts/:workoutId', async (req, res)=>{
  const updatedWorkout = await User.findOneAndUpdate({_id:req.params.userId, 'workouts._id':req.params.workoutId}, {'workouts.$.title':'chest'})
  console.log('tada', updatedWorkout)
})

// https://stackoverflow.com/questions/21522112/how-to-update-subdocument-with-findoneandupdate