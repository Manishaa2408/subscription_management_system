const jwt = require('jsonwebtoken');

/**
 * Generate signed JWT and configure HttpOnly cookie
 */
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const payload = {
    id: user._id || user.id,
    email: user.email,
    role: user.role
  };

  const secret = process.env.JWT_SECRET || 'brightloop_super_secret_jwt_key_hackathon_2026';
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';

  const token = jwt.sign(payload, secret, {
    expiresIn
  });

  const cookieOptions = {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  };

  res.cookie('token', token, cookieOptions);

  return res.status(statusCode).json({
    success: true,
    message,
    data: {
      user: {
        id: user._id || user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        isActive: user.isActive
      },
      token
    }
  });
};

module.exports = {
  sendTokenResponse
};
