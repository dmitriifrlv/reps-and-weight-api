const mongoose = require('mongoose')
const { Schema } = mongoose;

const exerciseSchema = new Schema({
  exercise: String,
  sets: [],
  measure: String
})

const workoutSchema = new Schema({
  date: Date,
  title: String,
  muscleGroups: [],
  exercises: [exerciseSchema]
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
