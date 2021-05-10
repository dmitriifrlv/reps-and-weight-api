const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const exerciseSchema = new Schema({
  exercise: String,
  reps1: Number,
  reps2: Number,
  reps3: Number,
  reps4: Number,
  reps5: Number,
  reps6: Number,
  weight1: Number,
  weight2: Number,
  weight3: Number,
  weight4: Number,
  weight5: Number,
  weight6: Number,
  measure: String
})

const workoutSchema = new Schema({
  date: String,
  title: String,
  exercise: [exerciseSchema]
})

const userSchema = new Schema({
  email: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  workouts: [workoutSchema]
}, { timestamps: true})

const User = mongoose.model('User', userSchema)
module.exports = User;
