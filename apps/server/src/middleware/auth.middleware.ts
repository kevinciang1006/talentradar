import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import Company from '../models/Company';
import ApiError from '../utils/ApiError';
import asyncHandler from '../utils/asyncHandler';

export const authenticate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Invalid or expired token', 'UNAUTHORIZED');
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    // Verify token
    const decoded = verifyToken(token);

    // Find company by ID from token
    const company = await Company.findById(decoded.id);

    if (!company) {
      throw new ApiError(401, 'Invalid or expired token', 'UNAUTHORIZED');
    }

    // Attach company info to request
    req.company = {
      id: company._id.toString(),
      email: company.email,
      name: company.name,
    };

    next();
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired token', 'UNAUTHORIZED');
  }
});
