const request = require("supertest");
const app = require("../../src/app");
const Auditorium = require("../../src/models/auditorium");
const Booking = require("../../src/models/booking");
const redisClient = require("../../src/config/redis");
const cloudinary = require("../../src/config/cloudinary");
const { createTestUser, createTestAdmin, createUnverifiedUser } = require("../helpers/authHelper");
const { createAuditoriumFixture, createBookingFixture } = require("../helpers/fixtures");

describe("Integration: Auditorium Routes (/api/auditoriums)", () => {
  describe("GET /api/auditoriums/viewAllAuditoriums", () => {
    it("should return all auditoriums and cache the result in Redis", async () => {
      await createAuditoriumFixture({ name: "Hall 1" });
      await createAuditoriumFixture({ name: "Hall 2" });

      const res = await request(app).get("/api/auditoriums/viewAllAuditoriums");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.total).toBe(2);
      expect(res.body.auditoriums).toHaveLength(2);

      // Verify cached in Redis
      const cached = await redisClient.get("auditoriums:all");
      expect(cached).not.toBeNull();
      const parsed = JSON.parse(cached);
      expect(parsed).toHaveLength(2);
    });
  });

  describe("GET /api/auditoriums/viewAuditorium/:id", () => {
    it("should return a single auditorium by ID", async () => {
      const auditorium = await createAuditoriumFixture({ name: "Main Hall A" });

      const res = await request(app).get(`/api/auditoriums/viewAuditorium/${auditorium._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.auditorium.name).toBe("Main Hall A");

      // Verify cached individually
      const cached = await redisClient.get(`auditorium:${auditorium._id}`);
      expect(cached).not.toBeNull();
    });

    it("should return 404 if auditorium is not found", async () => {
      const res = await request(app).get("/api/auditoriums/viewAuditorium/60c72b2f9b1d8b2bad000001");

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Auditorium not found");
    });
  });

  describe("POST /api/auditoriums/createAuditorium", () => {
    it("should allow verified admin to create an auditorium and invalidate auditoriums:all cache", async () => {
      const { authHeader } = await createTestAdmin();
      await redisClient.set("auditoriums:all", JSON.stringify([{ old: true }]));

      const payload = {
        name: "New Diamond Hall",
        capacity: 750,
        amenities: "AC, Sound, Wi-Fi",
        basePrice: 1500,
        description: "Modern facility for seminars and convocations.",
      };

      const res = await request(app)
        .post("/api/auditoriums/createAuditorium")
        .set("Authorization", authHeader)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.auditorium.name).toBe("New Diamond Hall");
      expect(res.body.auditorium.amenities).toEqual(["AC", "Sound", "Wi-Fi"]);

      // Verify cache invalidated
      const cache = await redisClient.get("auditoriums:all");
      expect(cache).toBeNull();
    });

    it("should forbid student from creating an auditorium with 403", async () => {
      const { authHeader } = await createTestUser();

      const res = await request(app)
        .post("/api/auditoriums/createAuditorium")
        .set("Authorization", authHeader)
        .send({
          name: "Illegal Hall",
          capacity: 100,
          amenities: "None",
          basePrice: 500,
          description: "Not allowed",
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Not authorized to perform this action");
    });

    it("should reject unverified admin with 401", async () => {
      const { authHeader } = await createUnverifiedUser({ role: "admin" });

      const res = await request(app)
        .post("/api/auditoriums/createAuditorium")
        .set("Authorization", authHeader)
        .send({
          name: "Unverified Admin Hall",
          capacity: 100,
          amenities: "None",
          basePrice: 500,
          description: "Not allowed",
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Please verify your email");
    });
  });

  describe("PUT /api/auditoriums/updateAuditorium/:id", () => {
    it("should update auditorium details and invalidate cache", async () => {
      const { authHeader } = await createTestAdmin();
      const auditorium = await createAuditoriumFixture({ name: "Old Name", basePrice: 500 });

      await redisClient.set("auditoriums:all", "cached");
      await redisClient.set(`auditorium:${auditorium._id}`, "cached");

      const res = await request(app)
        .put(`/api/auditoriums/updateAuditorium/${auditorium._id}`)
        .set("Authorization", authHeader)
        .send({
          name: "Updated Name",
          basePrice: 1200,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.auditorium.name).toBe("Updated Name");
      expect(res.body.auditorium.basePrice).toBe(1200);

      // Verify caches invalidated
      expect(await redisClient.get("auditoriums:all")).toBeNull();
      expect(await redisClient.get(`auditorium:${auditorium._id}`)).toBeNull();
    });

    it("should return 404 if updating non-existent auditorium", async () => {
      const { authHeader } = await createTestAdmin();

      const res = await request(app)
        .put("/api/auditoriums/updateAuditorium/60c72b2f9b1d8b2bad000001")
        .set("Authorization", authHeader)
        .send({ name: "Ghost Hall" });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Auditorium not found");
    });
  });

  describe("DELETE /api/auditoriums/deleteAuditorium/:id", () => {
    it("should block deletion with 400 if active bookings are associated with it", async () => {
      const { authHeader } = await createTestAdmin();
      const studentAuth = await createTestUser();
      const auditorium = await createAuditoriumFixture();

      // Create an active (pending) booking
      await createBookingFixture({
        user: studentAuth.user._id,
        auditorium: auditorium._id,
        status: "pending",
      });

      const res = await request(app)
        .delete(`/api/auditoriums/deleteAuditorium/${auditorium._id}`)
        .set("Authorization", authHeader);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("active booking(s) associated with it");

      // Verify auditorium was NOT deleted
      const stillExists = await Auditorium.findById(auditorium._id);
      expect(stillExists).not.toBeNull();
    });

    it("should delete auditorium successfully when no active bookings exist and clean up Cloudinary images", async () => {
      const { authHeader } = await createTestAdmin();
      const auditorium = await createAuditoriumFixture({
        images: ["https://res.cloudinary.com/demo/image/upload/v1/auditoriums/test_del.jpg"],
      });

      const res = await request(app)
        .delete(`/api/auditoriums/deleteAuditorium/${auditorium._id}`)
        .set("Authorization", authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Auditorium deleted successfully");

      // Verify deleted from MongoDB
      const checkDeleted = await Auditorium.findById(auditorium._id);
      expect(checkDeleted).toBeNull();

      // Verify Cloudinary destroy was invoked
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith("auditoriums/test_del");
    });
  });
});

