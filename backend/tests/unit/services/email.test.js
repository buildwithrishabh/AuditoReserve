describe("Unit: Email Service", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  it("should send email via Brevo HTTP API when API key begins with xkeysib-", async () => {
    process.env.BREVO_API_KEY = "xkeysib-test-mock-key";
    process.env.FROM_EMAIL = "system@auditoreserve.com";
    process.env.FROM_NAME = "AuditoReserve";

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messageId: "brevo-msg-12345" }),
    });
    global.fetch = mockFetch;

    const sendEmail = require("../../../src/service/email");

    const result = await sendEmail({
      to: "recipient@tmu.ac.in",
      subject: "Test Subject",
      html: "<p>Hello</p>",
      text: "Hello",
    });

    expect(result).toEqual({ messageId: "brevo-msg-12345" });
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.brevo.com/v3/smtp/email",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "api-key": "xkeysib-test-mock-key",
          "content-type": "application/json",
        }),
      })
    );
  });

  it("should throw an error when Brevo HTTP API returns non-ok status", async () => {
    process.env.BREVO_API_KEY = "xkeysib-test-invalid-key";
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ code: "unauthorized", message: "Key not found" }),
    });

    const sendEmail = require("../../../src/service/email");

    await expect(
      sendEmail({
        to: "recipient@tmu.ac.in",
        subject: "Test",
        html: "<p>Test</p>",
      })
    ).rejects.toThrow("Brevo HTTP API Error (401)");
  });

  it("should send email via Nodemailer SMTP fallback when Brevo API key is not present", async () => {
    delete process.env.BREVO_API_KEY;
    process.env.SMTP_HOST = "smtp.test.com";
    process.env.SMTP_PORT = "587";
    process.env.FROM_EMAIL = "system@auditoreserve.com";

    const mockSendMail = jest.fn().mockResolvedValue({ messageId: "smtp-msg-67890" });
    const nodemailer = require("nodemailer");
    jest.spyOn(nodemailer, "createTransport").mockReturnValue({
      sendMail: mockSendMail,
    });

    const sendEmail = require("../../../src/service/email");

    const result = await sendEmail({
      to: "recipient@tmu.ac.in",
      subject: "Test via SMTP",
      html: "<p>SMTP Test</p>",
      text: "SMTP Test",
    });

    expect(result).toEqual({ messageId: "smtp-msg-67890" });
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "recipient@tmu.ac.in",
        subject: "Test via SMTP",
      })
    );
  });
});

