import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User, Role, RefreshToken, VendorProfile, AuditLog } from '../models';
import {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
} from '../utils/errors';

export class AuthService {
  private generateAccessToken(userId: string, roleId: string): string {
    return jwt.sign({ userId, roleId }, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn as any,
    });
  }

  private async generateAndSaveRefreshToken(userId: string): Promise<string> {
    const rawToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.jwt.refreshExpiresInDays);

    await RefreshToken.create({
      userId,
      tokenHash,
      expiresAt,
    });

    return rawToken;
  }

  public async registerCustomer(data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }) {
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      throw new ConflictError('EMAIL_EXISTS', 'An account with this email address already exists');
    }

    const customerRole = await Role.findOne({ name: 'CUSTOMER' });
    if (!customerRole) {
      throw new NotFoundError('ROLE_NOT_FOUND', 'Default CUSTOMER role not found in system');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await User.create({
      email: data.email.toLowerCase(),
      passwordHash,
      name: data.name,
      phone: data.phone,
      roleId: customerRole._id,
      status: 'ACTIVE',
    });

    const accessToken = this.generateAccessToken(user._id.toString(), customerRole._id.toString());
    const refreshToken = await this.generateAndSaveRefreshToken(user._id.toString());

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: customerRole.name,
        permissions: customerRole.permissions,
      },
      accessToken,
      refreshToken,
    };
  }

  public async registerVendor(data: {
    email: string;
    password: string;
    name: string;
    businessName: string;
    contactNumber: string;
    address: string;
    timezone?: string;
    documents?: { filename: string; url: string; type: string }[];
  }) {
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      throw new ConflictError('EMAIL_EXISTS', 'An account with this email address already exists');
    }

    const vendorRole = await Role.findOne({ name: 'VENDOR' });
    if (!vendorRole) {
      throw new NotFoundError('ROLE_NOT_FOUND', 'Default VENDOR role not found in system');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await User.create({
      email: data.email.toLowerCase(),
      passwordHash,
      name: data.name,
      roleId: vendorRole._id,
      status: 'ACTIVE',
    });

    const profile = await VendorProfile.create({
      userId: user._id,
      businessName: data.businessName,
      contactNumber: data.contactNumber,
      address: data.address,
      timezone: data.timezone || 'Asia/Kolkata',
      documents: data.documents || [],
      status: 'PENDING',
    });

    const accessToken = this.generateAccessToken(user._id.toString(), vendorRole._id.toString());
    const refreshToken = await this.generateAndSaveRefreshToken(user._id.toString());

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: vendorRole.name,
        permissions: vendorRole.permissions,
        vendor: {
          id: profile._id.toString(),
          businessName: profile.businessName,
          status: profile.status,
        },
      },
      accessToken,
      refreshToken,
    };
  }

  public async login(email: string, password: string) {
    const user = await User.findOne({ email: email.toLowerCase() }).populate('roleId');
    if (!user) {
      throw new UnauthorizedError('INVALID_CREDENTIALS', 'Invalid email or password');
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedError('ACCOUNT_SUSPENDED', 'Your account has been suspended by an administrator');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const role = user.roleId as any;
    let vendorData: any = null;

    if (role.name === 'VENDOR') {
      const profile = await VendorProfile.findOne({ userId: user._id });
      if (profile) {
        vendorData = {
          id: profile._id.toString(),
          businessName: profile.businessName,
          status: profile.status,
          rejectionReason: profile.rejectionReason,
          timezone: profile.timezone,
        };
      }
    }

    const accessToken = this.generateAccessToken(user._id.toString(), role._id.toString());
    const refreshToken = await this.generateAndSaveRefreshToken(user._id.toString());

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: role.name,
        roleId: role._id.toString(),
        permissions: role.permissions,
        ...(vendorData ? { vendor: vendorData } : {}),
      },
      accessToken,
      refreshToken,
    };
  }

  public async refreshAccessToken(rawRefreshToken: string) {
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    const storedToken = await RefreshToken.findOne({
      tokenHash,
      revokedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    });

    if (!storedToken) {
      throw new UnauthorizedError('INVALID_REFRESH_TOKEN', 'Refresh token is expired, revoked, or invalid');
    }

    // Revoke old token (rotation)
    storedToken.revokedAt = new Date();
    await storedToken.save();

    const user = await User.findById(storedToken.userId).populate('roleId');
    if (!user || user.status === 'SUSPENDED') {
      throw new UnauthorizedError('USER_INACTIVE', 'User account is inactive');
    }

    const role = user.roleId as any;
    const newAccessToken = this.generateAccessToken(user._id.toString(), role._id.toString());
    const newRefreshToken = await this.generateAndSaveRefreshToken(user._id.toString());

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  public async logout(userId: string, rawRefreshToken?: string) {
    if (rawRefreshToken) {
      const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
      await RefreshToken.updateOne({ tokenHash }, { $set: { revokedAt: new Date() } });
    } else {
      // Invalidate all active refresh tokens for user
      await RefreshToken.updateMany(
        { userId, revokedAt: { $exists: false } },
        { $set: { revokedAt: new Date() } }
      );
    }
  }

  public async getMe(userId: string) {
    const user = await User.findById(userId).populate('roleId');
    if (!user) {
      throw new NotFoundError('USER_NOT_FOUND', 'User profile not found');
    }

    const role = user.roleId as any;
    let vendorData: any = null;

    if (role.name === 'VENDOR') {
      const profile = await VendorProfile.findOne({ userId: user._id });
      if (profile) {
        vendorData = {
          id: profile._id.toString(),
          businessName: profile.businessName,
          status: profile.status,
          rejectionReason: profile.rejectionReason,
          timezone: profile.timezone,
          address: profile.address,
          contactNumber: profile.contactNumber,
        };
      }
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: role.name,
      roleId: role._id.toString(),
      permissions: role.permissions,
      status: user.status,
      ...(vendorData ? { vendor: vendorData } : {}),
    };
  }

  public async forgotPassword(email: string) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Return clean success to prevent user enumeration
      return { message: 'If an account exists, a reset link has been generated.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetUrl = `${config.clientUrl}/reset-password?token=${resetToken}`;
    console.log(`\n======================================================`);
    console.log(`[PASSWORD RESET LINK FOR ${user.email}]:`);
    console.log(`${resetUrl}`);
    console.log(`======================================================\n`);

    return {
      message: 'If an account exists, a reset link has been generated.',
      debugLink: config.nodeEnv === 'development' ? resetUrl : undefined,
    };
  }

  public async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestError('INVALID_RESET_TOKEN', 'Password reset token is invalid or has expired');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Revoke all refresh tokens on password change
    await RefreshToken.updateMany({ userId: user._id }, { $set: { revokedAt: new Date() } });

    return { message: 'Password has been successfully reset. Please log in with your new password.' };
  }
}

export const authService = new AuthService();
