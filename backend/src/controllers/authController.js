const crypto = require('crypto');
const User = require('../models/User');
const { sendTokenResponse } = require('../utils/generateToken');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { validatePasswordStrength } = require('../utils/passwordValidator');

/**
 * @desc    Register a new customer
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { fullName, email, password, confirmPassword, phone } = req.body;

    // 1. Check required fields
    if (!fullName || !email || !password || !confirmPassword) {
      return sendError(res, 400, 'Please provide all required fields');
    }

    // 2. Validate password match
    if (password !== confirmPassword) {
      return sendError(res, 400, 'Passwords do not match');
    }

    // 3. Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return sendError(res, 400, passwordValidation.message);
    }

    // 4. Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // 5. Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return sendError(res, 409, 'An account with this email address already exists');
    }

    // 6. Security: Always assign customer role on public registration
    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password,
      phone: phone ? phone.trim() : '',
      role: 'customer',
      isActive: true
    });

    // 7. Return safe user info and log in with JWT cookie
    return sendTokenResponse(user, 201, res, 'Customer registration successful');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Login user (Admin, Staff, Customer)
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validate required fields
    if (!email || !password) {
      return sendError(res, 400, 'Please provide email and password');
    }

    // 2. Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // 3. Find user and include password field
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    // 4. Generic credential check (do not reveal if email exists)
    if (!user) {
      return sendError(res, 401, 'Invalid email or password');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return sendError(res, 401, 'Invalid email or password');
    }

    // 5. Check account status
    if (!user.isActive) {
      return sendError(
        res,
        403,
        'Your account has been deactivated. Please contact an administrator.'
      );
    }

    // 6. Dispatch JWT and cookie
    return sendTokenResponse(user, 200, res, 'Login successful');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get currently logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    return sendSuccess(res, 200, 'Current user retrieved successfully', {
      user: user.toSafeObject()
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Logout user & clear cookie
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res, next) => {
  try {
    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0),
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });

    return sendSuccess(res, 200, 'Logout successful');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Initiate forgot password workflow
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, 400, 'Please provide a registered email address');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Security practice: Always respond with success to prevent user enumeration
    if (!user) {
      return sendSuccess(
        res,
        200,
        'If an account with that email exists, password reset instructions have been sent.'
      );
    }

    // Generate random 32-byte reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token using SHA-256 and store in DB with 15-minute expiration
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save({ validateBeforeSave: false });

    // Reset URL
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    // Hackathon development mode fallback: Log to console
    console.log('\n======================================================');
    console.log('[DEV MODE - PASSWORD RESET LINK]');
    console.log(`User: ${user.email}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log('Valid for: 15 minutes');
    console.log('======================================================\n');

    return sendSuccess(
      res,
      200,
      'If an account with that email exists, password reset instructions have been sent.',
      {
        // Included for convenience during automated hackathon testing in non-production
        devResetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
      }
    );
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Reset password using token
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return sendError(res, 400, 'Please provide both password and password confirmation');
    }

    if (password !== confirmPassword) {
      return sendError(res, 400, 'Passwords do not match');
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return sendError(res, 400, passwordValidation.message);
    }

    // Hash token from parameter to match stored SHA-256 hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return sendError(res, 400, 'Password reset token is invalid or has expired');
    }

    // Update password (pre-save hook will hash it with bcryptjs)
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return sendSuccess(res, 200, 'Password has been reset successfully. You can now log in.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  forgotPassword,
  resetPassword
};
