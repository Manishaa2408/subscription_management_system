const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { validatePasswordStrength } = require('../utils/passwordValidator');

/**
 * @desc    Get all users with search, role filter, status filter, and pagination
 * @route   GET /api/users
 * @access  Private (Admin only)
 */
const getUsers = async (req, res, next) => {
  try {
    const { search, role, status, page = 1, limit = 10 } = req.query;

    const query = {};

    // Search by name or email
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { fullName: searchRegex },
        { email: searchRegex }
      ];
    }

    // Filter by role
    if (role && ['admin', 'staff', 'customer'].includes(role.toLowerCase())) {
      query.role = role.toLowerCase();
    }

    // Filter by active status
    if (status !== undefined && status !== '') {
      query.isActive = status === 'true';
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return sendSuccess(res, 200, 'Users retrieved successfully', {
      users: users.map((u) => u.toSafeObject()),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get user details by ID
 * @route   GET /api/users/:id
 * @access  Private (Admin only)
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    return sendSuccess(res, 200, 'User retrieved successfully', {
      user: user.toSafeObject()
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create a new Staff account
 * @route   POST /api/users/staff
 * @access  Private (Admin only)
 */
const createStaff = async (req, res, next) => {
  try {
    const { fullName, email, phone, password, confirmPassword } = req.body;

    // 1. Required fields
    if (!fullName || !email || !password) {
      return sendError(res, 400, 'Full name, email, and password are required');
    }

    // 2. Password confirmation check
    if (confirmPassword && password !== confirmPassword) {
      return sendError(res, 400, 'Passwords do not match');
    }

    // 3. Password strength check
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return sendError(res, 400, passwordValidation.message);
    }

    // 4. Duplicate email check
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return sendError(res, 409, 'An account with this email address already exists');
    }

    // 5. Create Staff user
    const staff = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: phone ? phone.trim() : '',
      password,
      role: 'staff',
      isActive: true
    });

    return sendSuccess(res, 201, 'Staff account created successfully', {
      user: staff.toSafeObject()
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update user active/inactive status
 * @route   PATCH /api/users/:id/status
 * @access  Private (Admin only)
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (isActive === undefined || typeof isActive !== 'boolean') {
      return sendError(res, 400, "Please provide 'isActive' boolean property");
    }

    const user = await User.findById(id);
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    // Safeguard: Protect against deactivating the last active Admin
    if (user.role === 'admin' && !isActive) {
      const activeAdminCount = await User.countDocuments({
        role: 'admin',
        isActive: true,
        _id: { $ne: user._id }
      });

      if (activeAdminCount === 0) {
        return sendError(
          res,
          400,
          'Cannot deactivate the last active Admin account in the system'
        );
      }
    }

    user.isActive = isActive;
    await user.save();

    return sendSuccess(
      res,
      200,
      `User account ${isActive ? 'activated' : 'deactivated'} successfully`,
      { user: user.toSafeObject() }
    );
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update user role
 * @route   PATCH /api/users/:id/role
 * @access  Private (Admin only)
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'staff', 'customer'].includes(role.toLowerCase())) {
      return sendError(res, 400, "Role must be 'admin', 'staff', or 'customer'");
    }

    const targetRole = role.toLowerCase();
    const user = await User.findById(id);
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    // Safeguard: If demoting an admin, ensure at least one other active admin remains
    if (user.role === 'admin' && targetRole !== 'admin') {
      const activeAdminCount = await User.countDocuments({
        role: 'admin',
        isActive: true,
        _id: { $ne: user._id }
      });

      if (activeAdminCount === 0) {
        return sendError(
          res,
          400,
          'Cannot demote the last active Admin account in the system'
        );
      }
    }

    user.role = targetRole;
    await user.save();

    return sendSuccess(res, 200, `User role updated to '${targetRole}' successfully`, {
      user: user.toSafeObject()
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createStaff,
  updateUserStatus,
  updateUserRole
};
