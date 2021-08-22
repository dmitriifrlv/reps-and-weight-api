const mongoose = require("mongoose");
const { Schema } = mongoose;

const exerciseSchema = new Schema({
  exercise: {
    type: String,
    required: true,
  },
  sets: {
    type: Array,
    required: true,
  },
  measure: {
    type: String,
    required: true,
  },
});

const workoutSchema = new Schema({
  date: {
    type: Date,
    required: true,
  },
  muscleGroups: {
    type: Array,
    required: true,
  },
  exercises: {
    type: [exerciseSchema],
    default: () => [],
    required: true,
  },
});

const userSchema = new Schema(
  {
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    workouts: {
      type: [workoutSchema],
      required: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
