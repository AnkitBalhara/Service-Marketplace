import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthenticatedRequest, AuthenticatedUser } from '../types';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { User, Role, VendorProfile } from '../models';

interface JwtPayload {
  userId: string;
  roleId: string;
  iat?: number;
  exp?: number;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('AUTH_REQUIRED', 'Authorization header with Bearer token is required');
    }

    const token = authHeader.split(' ')[1];
    let decoded: JwtPayload;

    try {
      decoded = jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedError('TOKEN_EXPIRED', 'Access token has expired');
      }
      throw new UnauthorizedError('INVALID_TOKEN', 'Access token is invalid');
    }

    const user = await User.findById(decoded.userId).populate('roleId');
    if (!user || user.status === 'SUSPENDED') {
      throw new UnauthorizedError('USER_INACTIVE', 'User account is inactive or not found');
    }

    const role = user.roleId as any;
    const permissions: string[] = role?.permissions || [];
    const roleName: string = role?.name || 'UNKNOWN';

    // If user is a vendor, fetch vendor profile status
    let vendorId: string | undefined;
    let vendorStatus: any | undefined;

    if (roleName === 'VENDOR') {
      const vendorProfile = await VendorProfile.findOne({ userId: user._id });
      if (vendorProfile) {
        vendorId = vendorProfile._id.toString();
        vendorStatus = vendorProfile.status;
      }
    }

    req.user = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      roleId: role._id ? role._id.toString() : decoded.roleId,
      roleName,
      permissions,
      vendorId,
      vendorStatus,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    let decoded: JwtPayload;

    try {
      decoded = jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
    } catch {
      return next();
    }

    const user = await User.findById(decoded.userId).populate('roleId');
    if (!user || user.status === 'SUSPENDED') {
      return next();
    }

    const role = user.roleId as any;
    const permissions: string[] = role?.permissions || [];
    const roleName: string = role?.name || 'UNKNOWN';

    let vendorId: string | undefined;
    let vendorStatus: any | undefined;

    if (roleName === 'VENDOR') {
      const vendorProfile = await VendorProfile.findOne({ userId: user._id });
      if (vendorProfile) {
        vendorId = vendorProfile._id.toString();
        vendorStatus = vendorProfile.status;
      }
    }

    req.user = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      roleId: role._id ? role._id.toString() : decoded.roleId,
      roleName,
      permissions,
      vendorId,
      vendorStatus,
    };

    next();
  } catch {
    next();
  }
};

/**
 * M2: Granular slug-based permission check.
 * SUPER_ADMIN bypasses all checks.
 */
export const requirePermission = (slug: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('AUTH_REQUIRED', 'Authentication required'));
    }

    // SUPER_ADMIN bypasses all permission checks
    if (req.user.roleName === 'SUPER_ADMIN') {
      return next();
    }

    if (!req.user.permissions || !req.user.permissions.includes(slug)) {
      return next(
        new ForbiddenError(
          'PERMISSION_DENIED',
          `You do not have the required permission: ${slug}`,
          { requiredPermission: slug, role: req.user.roleName }
        )
      );
    }

    next();
  };
};

/**
 * M3: Blocks vendors in PENDING or REJECTED state from performing vendor operations.
 */
export const requireApprovedVendor = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new UnauthorizedError('AUTH_REQUIRED', 'Authentication required'));
  }

  // Super admins and admins bypass vendor onboarding state
  if (req.user.roleName === 'SUPER_ADMIN' || req.user.roleName === 'ADMIN') {
    return next();
  }

  if (req.user.roleName !== 'VENDOR') {
    return next(new ForbiddenError('VENDOR_ROLE_REQUIRED', 'This action is only available to vendors'));
  }

  if (req.user.vendorStatus !== 'APPROVED') {
    return next(
      new ForbiddenError(
        'VENDOR_NOT_APPROVED',
        `Vendor account is in ${req.user.vendorStatus || 'PENDING'} status and cannot perform this action until approved by an administrator.`,
        { status: req.user.vendorStatus || 'PENDING' }
      )
    );
  }

  next();
};

/**
 * Extracts optional or required Idempotency-Key header
 */
export const extractIdempotencyKey = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const key = req.headers['idempotency-key'] as string;
  if (key) {
    req.idempotencyKey = key.trim();
  }
  next();
};
