const { acquireLock, releaseLock } = require("../../../src/utils/lock");
const redisClient = require("../../../src/config/redis");

describe("Unit: Distributed Lock Utils (Redlock)", () => {
  beforeEach(async () => {
    await redisClient.flushall();
  });

  it("should acquire lock successfully when key is free", async () => {
    const lock = await acquireLock("lock:auditorium:1", 5000);

    expect(lock).not.toBeNull();
    expect(lock.key).toBe("lock:auditorium:1");
    expect(typeof lock.value).toBe("string");

    const inRedis = await redisClient.get("lock:auditorium:1");
    expect(inRedis).toBe(lock.value);
  });

  it("should prevent concurrent acquisition of the same lock key", async () => {
    const lockA = await acquireLock("lock:auditorium:2", 5000);
    expect(lockA).not.toBeNull();

    const lockB = await acquireLock("lock:auditorium:2", 5000);
    expect(lockB).toBeNull();
  });

  it("should release lock safely only when owner value matches", async () => {
    const lock = await acquireLock("lock:auditorium:3", 5000);

    // Attempt release with wrong token
    const wrongRelease = await releaseLock(lock.key, "wrong-uuid-token");
    expect(wrongRelease).toBe(false);

    // Verify key is still held
    const stillHeld = await redisClient.get(lock.key);
    expect(stillHeld).toBe(lock.value);

    // Release with correct token
    const correctRelease = await releaseLock(lock.key, lock.value);
    expect(correctRelease).toBe(true);

    // Key should now be deleted
    const afterDelete = await redisClient.get(lock.key);
    expect(afterDelete).toBeNull();
  });

  it("should allow re-acquiring the lock after safe release", async () => {
    const lock1 = await acquireLock("lock:auditorium:4", 5000);
    await releaseLock(lock1.key, lock1.value);

    const lock2 = await acquireLock("lock:auditorium:4", 5000);
    expect(lock2).not.toBeNull();
  });
});

