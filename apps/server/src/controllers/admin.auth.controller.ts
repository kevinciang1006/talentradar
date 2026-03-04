import { Request, Response } from 'express';
import Admin from '../models/Admin';
import ApiError from '../utils/ApiError';
import asyncHandler from '../utils/asyncHandler';
import { signToken } from '../utils/jwt';
import { AdminLoginInput } from '../validators/admin.validators';

// Admin login
export const login = asyncHandler(async (req: Request<object, object, AdminLoginInput>, res: Response) => {
  const { email, password } = req.body;

  // Find admin with password hash
  const admin = await Admin.findOne({ email }).select('+passwordHash');
  if (!admin) {
    throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  // Compare password
  const isPasswordValid = await admin.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  // Sign JWT token
  const token = signToken({
    id: admin._id.toString(),
    email: admin.email,
    role: admin.role,
  });

  res.status(200).json({
    success: true,
    data: {
      token,
      admin: {
        id: admin._id.toString(),
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    },
  });
});

// Get current admin info
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const admin = await Admin.findById(req.admin?.id);

  if (!admin) {
    throw new ApiError(404, 'Admin not found', 'NOT_FOUND');
  }

  res.status(200).json({
    success: true,
    data: {
      admin: {
        id: admin._id.toString(),
        name: admin.name,
        email: admin.email,
        role: admin.role,
        createdAt: admin.createdAt,
      },
    },
  });
});
