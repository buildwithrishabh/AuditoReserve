const { getOrSetCache, delPattern, del } = require("../../../src/utils/cache");
const redisClient = require("../../../src/config/redis");

describe("Unit: Cache-Aside Utils", () => {
  beforeEach(async () => {
    await redisClient.flushall();
  });

  it("should execute callback and cache fresh data on cache miss", async () => {
    const callback = jest.fn().mockResolvedValue({ id: 1, name: "Hall A" });

    const result = await getOrSetCache("auditoriums:1", callback, 60);

    expect(result).toEqual({ id: 1, name: "Hall A" });
    expect(callback).toHaveBeenCalledTimes(1);

    const inRedis = await redisClient.get("auditoriums:1");
    expect(JSON.parse(inRedis)).toEqual({ id: 1, name: "Hall A" });
  });

  it("should return cached data directly on cache hit without invoking callback", async () => {
    await redisClient.set("auditoriums:cached", JSON.stringify({ cached: true }));
    const callback = jest.fn();

    const result = await getOrSetCache("auditoriums:cached", callback, 60);

    expect(result).toEqual({ cached: true });
    expect(callback).not.toHaveBeenCalled();
  });

  it("should fall back gracefully to callback when cached data is corrupted JSON", async () => {
    await redisClient.set("auditoriums:corrupted", "{not_valid_json");
    const callback = jest.fn().mockResolvedValue({ fallback: true });

    const result = await getOrSetCache("auditoriums:corrupted", callback, 60);

    expect(result).toEqual({ fallback: true });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should delete a single key using del", async () => {
    await redisClient.set("key_to_delete", "val");
    await del("key_to_delete");

    expect(await redisClient.get("key_to_delete")).toBeNull();
  });

  it("should delete matching keys using delPattern", async () => {
    await redisClient.set("pattern:1", "a");
    await redisClient.set("pattern:2", "b");
    await redisClient.set("other:key", "c");

    await delPattern("pattern:*");

    expect(await redisClient.get("pattern:1")).toBeNull();
    expect(await redisClient.get("pattern:2")).toBeNull();
    expect(await redisClient.get("other:key")).toBe("c");
  });
});

