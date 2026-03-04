import { Request, Response } from 'express';
import Company from '../models/Company';
import ApiError from '../utils/ApiError';
import asyncHandler from '../utils/asyncHandler';
import { signToken } from '../utils/jwt';
import { RegisterInput, LoginInput } from '../validators/auth.validators';

// Register a new company
export const register = asyncHandler(async (req: Request<object, object, RegisterInput>, res: Response) => {
  const { name, email, password, size, monthlyRevenue } = req.body;

  // Check if email already exists
  const existingCompany = await Company.findOne({ email });
  if (existingCompany) {
    throw new ApiError(409, 'Email already registered', 'DUPLICATE_EMAIL');
  }

  // Create company (password hashing happens in pre-save hook)
  const company = await Company.create({
    name,
    email,
    passwordHash: password,
    size,
    monthlyRevenue,
  });

  // Sign JWT token
  const token = signToken({
    id: company._id.toString(),
    email: company.email,
    role: 'company',
  });

  res.status(201).json({
    success: true,
    data: {
      token,
      company: {
        id: company._id.toString(),
        name: company.name,
        email: company.email,
        size: company.size,
        monthlyRevenue: company.monthlyRevenue,
      },
    },
  });
});

// Login a company
export const login = asyncHandler(async (req: Request<object, object, LoginInput>, res: Response) => {
  const { email, password } = req.body;

  // Find company with password hash
  const company = await Company.findOne({ email }).select('+passwordHash');
  if (!company) {
    throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  // Compare password
  const isPasswordValid = await company.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  // Sign JWT token
  const token = signToken({
    id: company._id.toString(),
    email: company.email,
    role: 'company',
  });

  res.status(200).json({
    success: true,
    data: {
      token,
      company: {
        id: company._id.toString(),
        name: company.name,
        email: company.email,
        size: company.size,
        monthlyRevenue: company.monthlyRevenue,
      },
    },
  });
});

// Get current company info
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const company = await Company.findById(req.company?.id);

  if (!company) {
    throw new ApiError(404, 'Company not found', 'NOT_FOUND');
  }

  res.status(200).json({
    success: true,
    data: {
      company: {
        id: company._id.toString(),
        name: company.name,
        email: company.email,
        size: company.size,
        monthlyRevenue: company.monthlyRevenue,
        createdAt: company.createdAt,
      },
    },
  });
});
