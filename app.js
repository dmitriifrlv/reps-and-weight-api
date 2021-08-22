require("dotenv").config();
const { createToken, hashPassword, verifyPassword } = require("./util");
const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/user");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const jwtDecode = require("jwt-decode");

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const dbURI = process.env.db_URL;
mongoose
  .connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then((result) => {
    app.listen(process.env.PORT || 5000);
    console.log("connected to db");
  })
  .catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("hello!");
});

app.get("/add-user", (req, res) => {
  const user = new User({
    email: "test@gmail.com",
    password: "123",
  });
  user
    .save()
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/signup", async (req, res) => {
  try {
    console.log("zz");
    const { email } = req.body;
    const hashedPassword = await hashPassword(req.body.password);
    const userData = {
      email: email.toLowerCase(),
      password: hashedPassword,
    };
    const existingEmail = await User.findOne({
      email: userData.email,
    }).lean();
    if (existingEmail) {
      console.log("aha!");
      return res.status(500).json({ message: "Email already exists" });
    }
    const newUser = new User(userData);
    const savedUser = await newUser.save();

    if (savedUser) {
      const token = createToken(savedUser);
      const decodedToken = jwtDecode(token);
      const expiresAt = decodedToken.exp;
      return res.json({
        message: "User created!",
        token,
        expiresAt,
        user: savedUser,
      });
    } else {
      return res.status(400).json({
        message: "There was a problem creating your account",
      });
    }
  } catch (err) {
    return res.status(400).json({
      message: "There was a problem creating your account",
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).lean();
    if (!user) {
      return res.status(400).json({ message: "Wrong password or email." });
    }

    const passwordCheck = await verifyPassword(password, user.password);

    if (passwordCheck) {
      const token = createToken(user);
      const decodedToken = jwtDecode(token);
      console.log(decodedToken);
      const expiresAt = decodedToken.exp;
      res.json({
        message: "Authentication successful!",
        token,
        user,
        expiresAt,
      });
    } else {
      res.status(403).json({
        message: "Wrong password or email.",
      });
    }
  } catch (err) {
    return res
      .status(400)
      .json({ message: "Something went wrong. Please try again." });
  }
});

//List of all users
app.get("/users", (req, res) => {
  User.find()
    .then((result) => res.send(result))
    .catch((err) => console.log(err));
});
//Specific User
app.get("/users/:userId", (req, res) => {
  User.findById(req.params.userId)
    .then((result) => res.send(result))
    .catch((err) => {
      console.log(err);
    });
});
//Add a workout
app.post("/users/:userId/", async (req, res) => {
  try {
    const result = await User.updateOne(
      { _id: req.params.userId },
      {
        $push: {
          workouts: req.body,
        },
      },
      { runValidators: true }
    );
    res.json({ message: "Workout added" });
  } catch (err) {
    return res.status(400).json({ error: err?.name });
  }
});

//List of workouts of a specific user

app.get("/users/:userId/workouts", async (req, res) => {
  const user = await User.findById(req.params.userId);
  const workouts = await user.workouts;
  res.send(workouts);
});

//Get a specific workout
app.get("/users/:userId/workouts/:workoutId", async (req, res) => {
  const user = await User.findById(req.params.userId);
  const workout = await user.workouts.id(req.params.workoutId);
  res.send(workout);
});

//Find all exercises
app.get("/users/:userId/workouts/:workoutId/exercise", async (req, res) => {
  const user = await User.findById(req.params.userId);
  const exercises = await user.workouts.id(req.params.workoutId).exercise;
  res.send(exercises);
});

//Find a specific exercise
app.get(
  "/users/:userId/workouts/:workoutId/exercise/:exerciseId",
  async (req, res) => {
    const user = await User.findById(req.params.userId);
    const exercises = await user.workouts
      .id(req.params.workoutId)
      .exercise.id(req.params.exerciseId);
    res.send(exercises);
  }
);

//Find a specific exercise
app.get(
  "/users/:userId/workouts/:workoutId/exercise/:exerciseId",
  async (req, res) => {
    const user = await User.findById(req.params.userId);
    const exercises = await user.workouts
      .id(req.params.workoutId)
      .exercise.id(req.params.exerciseId).exercise;
    res.send(exercises);
  }
);

//Add an exercise
app.post("/users/:userId/workouts/:workoutId", async (req, res) => {
  const user = await User.findById(req.params.userId);
  const workout = await user.workouts.id(req.params.workoutId);
  workout.exercise.push(req.body);
  user.save(function (err) {
    if (err) return console.log("fuck");
    console.log("exercise succesfully added!");
  });
});

//delete a workout
app.delete("/users/:userId/workouts/:workoutId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    user.workouts.id(req.params.workoutId).remove();
    // console.log(user.workouts.id(req.params.workoutId));
    user.save();
    res.status(201).json({
      message: "Workout deleted!",
    });
  } catch (err) {
    return res.status(400).json({
      message: "There was a problem deleting the workout.",
    });
  }
});
//delete an exercise
app.delete(
  "/users/:userId/workouts/:workoutId/exercise/:exerciseId",
  async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);
      const workout = await user.workouts.id(req.params.workoutId);
      workout.exercise.id(req.params.exerciseId).remove();
      user.save();
      res.status(201).json({
        message: "Exercise deleted!",
      });
    } catch (err) {
      return res.status(400).json({
        message: "There was a problem deleting the exercise.",
      });
    }
  }
);

//update a workout
app.patch("/users/:userId/workouts/:workoutId", async (req, res) => {
  const updatedWorkout = await User.findOneAndUpdate(
    { "workouts._id": req.params.workoutId },
    req.body
  );
  res.send(updatedWorkout);
});

// https://stackoverflow.com/questions/21522112/how-to-update-subdocument-with-findoneandupdate
