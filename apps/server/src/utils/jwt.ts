import jwt, { JwtPayload } from 'jsonwebtoken';
import { config } from '../config/env';

interface TokenPayload {
  id: string;
  email: string;
  role?: string;
}

export const signToken = (payload: TokenPayload): string => {
  // @ts-ignore - JWT config typing issue with Zod
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.JWT_SECRET) as JwtPayload;
};
