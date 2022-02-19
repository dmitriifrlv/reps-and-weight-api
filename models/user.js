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
});

const userSchema = new Schema(
  {
    email: {
      type: String,
      unique: true,
      // required: true,
    },
    password: {
      type: String,
      // required: true,
    },
    workouts: {
      type: [workoutSchema],
      // required: true,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
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
