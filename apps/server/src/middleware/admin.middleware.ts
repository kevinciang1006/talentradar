import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import Admin from '../models/Admin';
import ApiError from '../utils/ApiError';
import asyncHandler from '../utils/asyncHandler';

export const authenticateAdmin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Invalid or expired token', 'UNAUTHORIZED');
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    // Verify token
    const decoded = verifyToken(token);

    // Verify the token has admin or csm role
    if (!decoded.role || (decoded.role !== 'admin' && decoded.role !== 'csm')) {
      throw new ApiError(401, 'Invalid or expired token', 'UNAUTHORIZED');
    }

    // Find admin by ID from token
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      throw new ApiError(401, 'Invalid or expired token', 'UNAUTHORIZED');
    }

    // Attach admin info to request
    req.admin = {
      id: admin._id.toString(),
      email: admin.email,
      name: admin.name,
    };

    next();
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired token', 'UNAUTHORIZED');
  }
});
