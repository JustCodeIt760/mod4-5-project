const express = require('express');
const bcrypt = require('bcryptjs');

const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { User } = require('../../db/models');

const router = express.Router();

const { check, validationResult } = require('express-validator');

const validateSignup = [
  check('email')
    .exists({ checkFalsy: true })
    .withMessage('Invalid email')
    .isEmail()
    .withMessage('Invalid email')
    .custom(async value => {
      const existingUser = await User.findOne({
        where: { email: value }
      });
      if (existingUser) {
        throw new Error('User with that email already exists');
      }
      return true;
    }),
  check('username')
    .exists({ checkFalsy: true })
    .withMessage('Username is required')
    .isLength({ min: 4 })
    .withMessage('Username is required')
    .not()
    .isEmail()
    .withMessage('Username cannot be an email')
    .custom(async value => {
      const existingUser = await User.findOne({
        where: { username: value }
      });
      if (existingUser) {
        throw new Error('User with that username already exists');
      }
      return true;
    }),
  check('firstName')
    .exists({ checkFalsy: true })
    .withMessage('First Name is required'),
  check('lastName')
    .exists({ checkFalsy: true })
    .withMessage('Last Name is required'),
  check('password')
    .exists({ checkFalsy: true })
    .isLength({ min: 6 })
    .withMessage('Password must be 6 characters or more'),
  (req, res, next) => {
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
      const errors = {};
      validationErrors
        .array()
        .forEach(error => errors[error.path] = error.msg);

      // Check if errors include duplicate email/username
      if (errors.email?.includes('exists') || errors.username?.includes('exists')) {
        return res.status(500).json({
          message: 'User already exists',
          errors: {
            email: errors.email?.includes('exists') ? errors.email : undefined,
            username: errors.username?.includes('exists') ? errors.username : undefined
          }
        });
      }

      return res.status(400).json({
        message: "Bad Request",
        errors
      });
    }
    next();
  }
];

// Sign up
router.post('/', validateSignup, async (req, res) => {
  const { email, password, username, firstName, lastName } = req.body;
  const hashedPassword = bcrypt.hashSync(password);
  
  const user = await User.create({ 
    email, 
    username, 
    hashedPassword,
    firstName,
    lastName 
  });

  const safeUser = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    username: user.username
  };

  await setTokenCookie(res, safeUser);

  return res.status(201).json({
    user: safeUser
  });
});

module.exports = router;