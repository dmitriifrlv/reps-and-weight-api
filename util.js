const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const createToken = (user) => {
  // Sign the JWT
  return jwt.sign(
    {
      sub: user._id,
      email: user.email,
      iss: "api.reps-and-weigh",
      aud: "api.reps-and-weigh",
    },
    process.env.JWT_SECRET,
    { algorithm: "HS256", expiresIn: "1h" }
  );
};

const hashPassword = (password) => {
  return new Promise((resolve, reject) => {
    console.log("hash");
    // Generate a salt at level 12 strength
    bcrypt.genSalt(12, (err, salt) => {
      if (err) {
        reject(err);
      }
      bcrypt.hash(password, salt, (err, hash) => {
        if (err) {
          reject(err);
        }
        resolve(hash);
      });
    });
  });
};

const verifyPassword = (passwordAttempt, hashedPassword) => {
  return bcrypt.compare(passwordAttempt, hashedPassword);
};

module.exports = {
  createToken,
  hashPassword,
  verifyPassword,
};
