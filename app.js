require("dotenv").config();
const { createToken, hashPassword, verifyPassword } = require("./util");
const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/user");
const cors = require("cors");
const app = express();
const jwt = require("express-jwt");
const cookieParser = require("cookie-parser");

const jwtDecode = require("jwt-decode");
const checkJwt = jwt({
  secret: process.env.JWT_SECRET,
  iss: "api.reps-and-weigh",
  aud: "api.reps-and-weigh",
  algorithms: ["HS256"],
  getToken: (req) => req.cookies.token,
});

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

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

app.get("/getSomeData", (req, res) => {
  const data =
    "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";
  setTimeout(function () {
    res.send(data);
  }, 6000);
});
app.get("/getSomeMoreData", (req, res) => {
  const data = `Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.`;
  setTimeout(function () {
    res.send(data);
  }, 6000);
});
app.get("/getEvenMoreData", (req, res) => {
  const data = `There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text. All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. It uses a dictionary of over 200 Latin words, combined with a handful of model sentence structures, to generate Lorem Ipsum which looks reasonable. The generated Lorem Ipsum is therefore always free from repetition, injected humour, or non-characteristic words etc.`;
  setTimeout(function () {
    res.send(data);
  }, 6000);
});

app.post("/signup", async (req, res) => {
  try {
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
      const expiresAt = decodedToken.exp;

      res.cookie("token", token, { httpOnly: true });

      res.json({
        message: "Authentication successful!",
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

//in order to check for jwt I can either use middleware like below or add a swcond argument checkJwt to every endpoint
// app.use(checkJwt);

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
    console.log(err);
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
    if (err) return;
    console.log("exercise succesfully added!");
  });
});

//delete a workout
app.delete("/users/:userId/workouts/:workoutId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    user.workouts.id(req.params.workoutId).remove();
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
app.put("/users/:userId/workouts/:workoutId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    const idx = await user.workouts.findIndex(
      (i) => i.id === req.params.workoutId
    );
    user.workouts.splice(idx, 1, req.body);
    user.save();
    res.status(201).json({
      message: "Workout edited!",
    });
  } catch (err) {
    return res.status(400).json({
      message: "There was a problem editing the exercise.",
    });
  }
});

// https://stackoverflow.com/questions/21522112/how-to-update-subdocument-with-findoneandupdate
