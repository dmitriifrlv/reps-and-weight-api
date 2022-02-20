require("dotenv").config();
const { createToken, hashPassword, verifyPassword } = require("./util");
const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/user");
const cors = require("cors");
const app = express();
const jwt = require("express-jwt");
const cookieParser = require("cookie-parser");
const sendEmail = require("./utils/email");
const crypto = require("crypto");
const jwtDecode = require("jwt-decode");

const checkJwt = jwt({
  secret: process.env.JWT_SECRET,
  iss: "api.reps-and-weigh",
  aud: "api.reps-and-weigh",
  algorithms: ["HS256"],
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
    app.listen(process.env.PORT || 5005);
    console.log("connected to db");
  })
  .catch((err) => console.log("err", err));

app.post("/forgotPassword", async (req, res) => {
  const email = req.body.email.toLowerCase();
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({
      message: "There is no user with this email",
    });
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  const url =
    process.env.NODE_ENV === "development"
      ? process.env.CLIENT_URL_DEVELOPMENT
      : process.env.CLIENT_URL_PRODUCTION;

  const resetLink = `${url}create-new-password/${resetToken}`;
  const message = `<p>Forgot your password? Happens all the time! <a href=${resetLink}>Click here</a> to set a new one. The link will expire in 10 minutes.</p> <p>If you didn't forget your password, please ignore this email.</p>`;
  try {
    await sendEmail({
      email,
      subject: "Your password reset link",
      message,
    });
    return res.status(200).json({
      message: "Message has been successfully sent!!!!!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordresetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return res.status(500).json({
      message: "There was an error sending the email. try again later!",
    });
  }
});

app.patch("/resetPassword/:token", async (req, res) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    return res.status(400).json({ message: "Token is invalid or has expired" });
  }
  const hashedPassword = await hashPassword(req.body.password);
  user.password = hashedPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.status(200).json({
    message: "Your password has been succesfully changed!",
  });
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
        message: "Internal errr.There was a problem creating your account",
      });
    }
  } catch (err) {
    return res.status(400).json({
      message: "External error.There was a problem creating your account",
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

      res.json({
        message: "Authentication successful!",
        user,
        expiresAt,
        token,
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

const attachUser = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: "Authentication invalid" });
  }

  const decodedToken = jwtDecode(token.slice(7));

  if (!decodedToken) {
    return res.status(401).json({
      message: "There was a problem authorizing the request",
    });
  } else {
    req.user = decodedToken;
    next();
  }
};

app.use(checkJwt);
app.use(attachUser);

//in order to check for jwt I can either use middleware like below or add a second argument checkJwt to every endpoint

//List of all users
app.get("/users", (req, res) => {
  User.find()
    .then((result) => res.send(result))
    .catch((err) => console.log(err));
});

//Get User Info
app.get("/user", (req, res) => {
  User.findById(req.user.sub)
    .then((result) => res.send(result))
    .catch((err) => {
      console.log(err);
    });
});
//Add a workout
app.post("/workout", async (req, res) => {
  try {
    const result = await User.updateOne(
      { _id: req.user.sub },
      {
        $push: {
          workouts: req.body,
        },
      }
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
app.get("/workout/:workoutId", async (req, res) => {
  const user = await User.findById(req.user.sub);
  const workout = await user.workouts.id(req.params.workoutId);
  res.send(workout);
});

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

//delete a workout
app.delete("/workout/:workoutId", async (req, res) => {
  try {
    const user = await User.findById(req.user.sub);
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

//update a workout
app.put("/workout/:workoutId", async (req, res) => {
  try {
    const user = await User.findById(req.user.sub);
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
