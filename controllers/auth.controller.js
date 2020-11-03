const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user_schema");
const { validationResult } = require("express-validator");

const showError = require("../config/showError");
const generateToken = require("../config/generateToken");

const signUp = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: errors.array(),
    });
  }

  const { name, username, password, email, description, devrole } = req.body;

  try {
    const user = await User.findOne({ $or: [{ username }, { email }] });

    //id user exists return error
    if (user) {
      return res.status(400).json({
        error:
          user.email.toLowerCase() === email.toLowerCase()
            ? "User with this email already exists"
            : "User with this username already exists",
      });
    }

    //create new user
    const newUser = new User({
      name,
      username,
      password,
      email,
      description,
      devrole,
    });

    // encrypt the password
    const sault = await bcrypt.genSalt(12);
    newUser.password = await bcrypt.hash(newUser.password, sault);

    //generate jwt for user
    const token = generateToken(newUser, jwt);
    await newUser.save();

    return res.status(200).json({
      user: {
        name,
        username,
        email,
        description,
        devrole,
      },
      token,
    });
  } catch (error) {
    showError(error, res);
  }
};

const signIn = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: errors.array(),
    });
  }

  const { email, password } = req.body;

  try {
    //check user with email exist or not
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(422).json({
        error: "Invalid credentials",
      });
    }
    //match hash password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(422).json({
        error: "Invalid credentials",
      });
    }
    //generate token
    const token = generateToken(user, jwt);

    return res.status(200).json({
      user: {
        name: user.name,
        username: user.username,
        email: user.email,
        description: user.description,
        devrole: user.devrole,
      },
      token,
    });
  } catch (error) {
    showError(error, res);
  }
};

module.exports = {
  signUp,
  signIn,
};
