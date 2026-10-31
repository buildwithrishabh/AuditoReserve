let capturedProcessor;

jest.mock("bullmq", () => ({
  ...jest.requireActual("bullmq"),
  Worker: jest.fn().mockImplementation((name, processor) => {
    capturedProcessor = processor;
    return {
      on: jest.fn(),
      close: jest.fn().mockResolvedValue(),
    };
  }),
}));

jest.mock("../../../src/service/email", () => jest.fn().mockResolvedValue({ messageId: "email-123" }));

describe("Unit: Email Background Worker", () => {
  beforeAll(() => {
    require("../../../src/worker/emailWorker");
  });

  it("should process email job and invoke sendEmail service", async () => {
    const sendEmail = require("../../../src/service/email");
    const job = {
      data: {
        options: {
          to: "user@tmu.ac.in",
          subject: "Welcome",
          html: "<p>Welcome</p>",
        },
      },
    };

    expect(typeof capturedProcessor).toBe("function");
    await capturedProcessor(job);

    expect(sendEmail).toHaveBeenCalledWith(job.data.options);
  });
});

