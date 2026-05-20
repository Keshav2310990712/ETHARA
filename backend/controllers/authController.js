const { User } = require('../models');
const jwt = require('jsonwebtoken');

const signToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return jwt.sign({ id }, secret, {
    expiresIn: '7d'
  });
};

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email and password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Avatar generation via multiavatar or standard fallback
    const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`;

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      avatarUrl
    });

    const token = signToken(user.id);

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Error signing up user' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Incorrect email or password' });
    }

    const token = signToken(user.id);

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Error logging in user' });
  }
};

exports.getMe = async (req, res) => {
  try {
    return res.status(200).json({
      user: req.user
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving profile' });
  }
};
