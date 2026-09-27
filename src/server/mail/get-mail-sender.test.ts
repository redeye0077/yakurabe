import { afterEach, describe, expect, it, vi } from "vitest";
import { getMailSender, resetMailSenderForTest } from "@/server/mail/get-mail-sender";
import { SesMailSender } from "@/server/mail/ses-mail-sender";
import { SmtpMailSender } from "@/server/mail/smtp-mail-sender";

afterEach(() => {
  vi.unstubAllEnvs();
  resetMailSenderForTest();
});

function stubSmtpEnv() {
  vi.stubEnv("MAIL_DRIVER", "smtp");
  vi.stubEnv("MAIL_FROM", "no-reply@yakurabe.local");
  vi.stubEnv("SMTP_HOST", "localhost");
  vi.stubEnv("SMTP_PORT", "1025");
}

describe("getMailSender", () => {
  it("MAIL_DRIVER=smtp のときSmtpMailSenderを返す", () => {
    stubSmtpEnv();
    expect(getMailSender()).toBeInstanceOf(SmtpMailSender);
  });

  it("MAIL_DRIVER=ses のときSesMailSenderを返す", () => {
    vi.stubEnv("MAIL_DRIVER", "ses");
    vi.stubEnv("MAIL_FROM", "no-reply@example.com");
    vi.stubEnv("AWS_REGION", "ap-northeast-1");
    vi.stubEnv("AWS_ACCESS_KEY_ID", "dummy");
    vi.stubEnv("AWS_SECRET_ACCESS_KEY", "dummy");
    expect(getMailSender()).toBeInstanceOf(SesMailSender);
  });

  it("2回目以降は同じインスタンスを返す", () => {
    stubSmtpEnv();
    expect(getMailSender()).toBe(getMailSender());
  });

  it("MAIL_DRIVERが未設定ならエラーになる", () => {
    vi.stubEnv("MAIL_DRIVER", undefined);
    expect(() => getMailSender()).toThrow("メール送信の環境変数が不正です");
  });

  it("SESでアクセスキーが無ければエラーになる", () => {
    vi.stubEnv("MAIL_DRIVER", "ses");
    vi.stubEnv("MAIL_FROM", "no-reply@example.com");
    vi.stubEnv("AWS_REGION", "ap-northeast-1");
    vi.stubEnv("AWS_ACCESS_KEY_ID", undefined);
    vi.stubEnv("AWS_SECRET_ACCESS_KEY", undefined);
    expect(() => getMailSender()).toThrow(/AWS_ACCESS_KEY_ID/);
  });
});
