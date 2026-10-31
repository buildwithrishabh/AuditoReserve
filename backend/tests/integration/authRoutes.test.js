const request = require("supertest");
const crypto = require("crypto");
const app = require("../../src/app");
const User = require("../../src/models/User");
const emailQueue = require("../../src/queue/emailQueue");
const { createTestUser, createUnverifiedUser } = require("../helpers/authHelper");

describe("Integration: Auth Routes (/api/auth)", () => {
  describe("POST /api/auth/register", () => {
    it("should successfully register a student with university email, hash password, create verification token, and enqueue email", async () => {
      const email = `newstudent_${Date.now()}@tmu.ac.in`;
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Rohit Kumar",
          email,
          password: "SecurePassword123!",
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("User registered successfully");
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(email.toLowerCase());
      expect(res.body.user.role).toBe("student");

      // Verify user in database
      const dbUser = await User.findOne({ email: email.toLowerCase() });
      expect(dbUser).not.toBeNull();
      expect(dbUser.isVerified).toBe(false);
      expect(dbUser.password).not.toBe("SecurePassword123!"); // Must be hashed
      expect(dbUser.verificationToken).toBeDefined();
      expect(dbUser.verificationTokenExpires).toBeDefined();

      // Verify email queued
      expect(emailQueue.add).toHaveBeenCalledWith(
        "send-verification-email",
        expect.objectContaining({
          options: expect.objectContaining({
            to: email.toLowerCase(),
            subject: expect.stringContaining("Verify your email"),
          }),
        })
      );
    });

    it("should reject registration with 400 if email domain does not match university domain", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Outside User",
          email: "outsider@gmail.com",
          password: "Password123",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Please use your university email");
    });

    it("should reject registration with 400 if email already exists", async () => {
      const { user } = await createTestUser({ email: `existing_${Date.now()}@tmu.ac.in` });

      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Duplicate User",
          email: user.email,
          password: "Password123",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("User already exists");
    });

    it("should reject registration with 400 if required fields are missing", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ name: "Incomplete" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Please fill all fields");
    });
  });

  describe("GET /api/auth/verify-email", () => {
    it("should verify the user when provided a valid, non-expired token", async () => {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

      const user = await User.create({
        name: "Unverified Student",
        email: `unverified_${Date.now()}@tmu.ac.in`,
        password: "hashed_dummy_password",
        isVerified: false,
        verificationToken: hashedToken,
        verificationTokenExpires: Date.now() + 60 * 60 * 1000,
      });

      const res = await request(app)
        .get("/api/auth/verify-email")
        .query({ token: rawToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("Email verified successfully");

      const updated = await User.findById(user._id);
      expect(updated.isVerified).toBe(true);
      expect(updated.verificationToken).toBeUndefined();
    });

    it("should reject with 400 if verification token is missing", async () => {
      const res = await request(app).get("/api/auth/verify-email");

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Verification token is missing");
    });

    it("should reject with 400 if verification token is invalid or expired", async () => {
      const res = await request(app)
        .get("/api/auth/verify-email")
        .query({ token: "nonexistent_token" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid or expired verification token");
    });
  });

  describe("POST /api/auth/login", () => {
    it("should authenticate verified user, return accessToken, set HttpOnly cookies, and save hashed refresh token", async () => {
      const email = `login_${Date.now()}@tmu.ac.in`;
      const password = "ValidPassword123";
      await createTestUser({ email, rawPassword: password, isVerified: true });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email, password });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Login successful");
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.email).toBe(email);

      // Verify cookies set
      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes("accessToken="))).toBe(true);
      expect(cookies.some((c) => c.includes("refreshToken="))).toBe(true);
      expect(cookies.some((c) => c.includes("HttpOnly"))).toBe(true);

      // Verify refresh token in DB
      const dbUser = await User.findOne({ email });
      expect(dbUser.refreshToken).toBeDefined();
    });

    it("should reject login with 401 if user email is not verified", async () => {
      const email = `unverified_login_${Date.now()}@tmu.ac.in`;
      const password = "Password123";
      await createUnverifiedUser({ email, rawPassword: password });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email, password });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Please verify your email to login");
    });

    it("should reject login with 400 if password does not match", async () => {
      const email = `wrong_pass_${Date.now()}@tmu.ac.in`;
      await createTestUser({ email, rawPassword: "RealPassword123" });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email, password: "WrongPassword" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid credentials");
    });

    it("should reject login with 400 if email is not found", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "doesnotexist@tmu.ac.in", password: "Password123" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid credentials");
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("should rotate refresh token and return a new access token", async () => {
      const { user, refreshToken } = await createTestUser();

      const res = await request(app)
        .post("/api/auth/refresh")
        .set("Cookie", [`refreshToken=${refreshToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Refresh token successful");
      expect(res.body.accessToken).toBeDefined();

      // Check rotated refresh token in DB
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.refreshToken).toBeDefined();
    });

    it("should reject refresh with 401 if refreshToken cookie is missing", async () => {
      const res = await request(app).post("/api/auth/refresh");

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Refresh token missing");
    });

    it("should reject refresh with 403 if refreshToken does not match DB hash (token reuse or revoking)", async () => {
      const { user } = await createTestUser();
      const jwt = require("jsonwebtoken");
      const fakeRefreshToken = jwt.sign(
        { id: user._id, email: user.email, name: user.name, nonce: "revoked_or_reused" },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
      );

      const res = await request(app)
        .post("/api/auth/refresh")
        .set("Cookie", [`refreshToken=${fakeRefreshToken}`]);

      expect(res.status).toBe(403);
      expect(res.body.message).toBe("Refresh token mismatch");
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should clear auth cookies and nullify refresh token in database", async () => {
      const { user, refreshToken } = await createTestUser();

      const res = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", [`refreshToken=${refreshToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Logged out successfully");

      const dbUser = await User.findById(user._id);
      expect(dbUser.refreshToken).toBeNull();
    });
  });

  describe("POST /api/auth/forget-password and /api/auth/reset-password/:token", () => {
    it("should generate reset token, email it, and allow password reset", async () => {
      const { user } = await createTestUser();

      // 1. Request password reset
      const forgotRes = await request(app)
        .post("/api/auth/forget-password")
        .send({ email: user.email });

      expect(forgotRes.status).toBe(200);
      expect(forgotRes.body.message).toBe("Password reset email sent");

      expect(emailQueue.add).toHaveBeenCalledWith(
        "send-reset-password-email",
        expect.objectContaining({
          options: expect.objectContaining({
            to: user.email,
            subject: expect.stringContaining("Reset your password"),
          }),
        })
      );

      // Verify reset token hashed in DB
      const userWithReset = await User.findById(user._id);
      expect(userWithReset.resetPasswordToken).toBeDefined();
      expect(userWithReset.resetPasswordExpires).toBeDefined();

      // 2. Perform reset
      const rawResetToken = "manual_test_token_12345";
      const hashedManualToken = crypto.createHash("sha256").update(rawResetToken).digest("hex");
      userWithReset.resetPasswordToken = hashedManualToken;
      userWithReset.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
      await userWithReset.save();

      const resetRes = await request(app)
        .post(`/api/auth/reset-password/${rawResetToken}`)
        .send({ password: "NewStrongPassword456!" });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.message).toBe("Password reset successful");

      // Verify can login with new password
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: user.email, password: "NewStrongPassword456!" });
      expect(loginRes.status).toBe(200);
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return profile details for authenticated user", async () => {
      const { user, authHeader } = await createTestUser();

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.id).toBe(user._id.toString());
      expect(res.body.user.email).toBe(user.email);
    });

    it("should reject with 401 if unauthenticated", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });
  });
});
