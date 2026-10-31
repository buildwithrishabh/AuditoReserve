const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { generateAccessToken, generateRefreshToken, hashToken } = require("../../../src/utils/jwt");

describe("Unit: JWT Utils", () => {
  const dummyUser = {
    _id: new mongoose.Types.ObjectId(),
    email: "student@tmu.ac.in",
    name: "Aman Sharma",
  };

  it("should generate a valid access token with 15m expiry and correct payload", () => {
    const token = generateAccessToken(dummyUser);
    expect(typeof token).toBe("string");

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    expect(decoded.id).toBe(dummyUser._id.toString());
    expect(decoded.email).toBe(dummyUser.email);
    expect(decoded.name).toBe(dummyUser.name);
    // Expiration should be within ~15 minutes
    expect(decoded.exp - decoded.iat).toBe(15 * 60);
  });

  it("should generate a valid refresh token with 7d expiry and correct payload", () => {
    const token = generateRefreshToken(dummyUser);
    expect(typeof token).toBe("string");

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    expect(decoded.id).toBe(dummyUser._id.toString());
    expect(decoded.exp - decoded.iat).toBe(7 * 24 * 60 * 60);
  });

  it("should produce a consistent SHA-256 hex digest using hashToken", () => {
    const token = "sample_raw_refresh_token_12345";
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex characters
    expect(hashToken("different_token")).not.toBe(hash1);
  });
});

