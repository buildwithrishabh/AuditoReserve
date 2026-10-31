const { z } = require("zod");
const { objectIdSchema } = require("./commonValidators");

const notificationIdParamSchema = {
  params: z.object({
    id: objectIdSchema,
  }),
};

const getNotificationsQuerySchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
};

module.exports = {
  notificationIdParamSchema,
  getNotificationsQuerySchema,
};

