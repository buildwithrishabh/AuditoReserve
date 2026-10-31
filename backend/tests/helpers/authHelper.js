const bcrypt = require("bcryptjs");
const User = require("../../src/models/User");
const { generateAccessToken, generateRefreshToken, hashToken } = require("../../src/utils/jwt");

const createTestUser = async (overrides = {}) => {
  const salt = await bcrypt.genSalt(10);
  const password = overrides.rawPassword || "password123";
  const hashedPassword = await bcrypt.hash(password, salt);

  const defaultUser = {
    name: "Test User",
    email: `student_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@tmu.ac.in`,
    password: hashedPassword,
    role: "student",
    isVerified: true,
  };

  const userData = { ...defaultUser, ...overrides };
  delete userData.rawPassword;

  const user = await User.create(userData);

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = hashToken(refreshToken);
  await user.save();

  return {
    user,
    accessToken,
    refreshToken,
    rawPassword: password,
    authHeader: `Bearer ${accessToken}`,
    authCookie: [`accessToken=${accessToken}`, `refreshToken=${refreshToken}`],
  };
};

const createTestAdmin = async (overrides = {}) => {
  return createTestUser({
    name: "Admin User",
    email: `admin_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@tmu.ac.in`,
    role: "admin",
    isVerified: true,
    ...overrides,
  });
};

const createUnverifiedUser = async (overrides = {}) => {
  return createTestUser({
    name: "Unverified User",
    email: `unverified_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@tmu.ac.in`,
    isVerified: false,
    ...overrides,
  });
};

module.exports = {
  createTestUser,
  createTestAdmin,
  createUnverifiedUser,
};

