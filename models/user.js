const mongoose = require("mongoose");
const { Schema } = mongoose;
const crypto = require("crypto");

const exerciseSchema = new Schema({
  exercise: {
    type: String,
    // required: true,
  },
  sets: {
    type: Array,
    // required: true,
  },
  measure: {
    type: String,
  },
  isCompleted: Boolean,
});

const workoutSchema = new Schema({
  date: {
    type: Date,
    // required: true,
  },
  muscleGroups: {
    type: Array,
    // required: true,
  },
  exercises: {
    type: [exerciseSchema],
    default: () => [],
    // required: true,
  },
  isCompleted: Boolean,
  weekday: string,
  workoutPlanId: string,
});

const workoutPlanSchema = new Schema({
  title: String,
  schedule: {
    mon: Boolean,
    tue: Boolean,
    wed: Boolean,
    thu: Boolean,
    fri: Boolean,
    sat: Boolean,
    sun: Boolean,
  },
  workouts: [workoutSchema],
});

const userSchema = new Schema(
  {
    email: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
    },
    workouts: {
      type: [workoutSchema],
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    currentPlanId: String,
    workoutPlans: [workoutPlanSchema],
  },
  { timestamps: true }
);

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
