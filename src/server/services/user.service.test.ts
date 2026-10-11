import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserService, LOGIN_DISABLED_PASSWORD_HASH } from "@/server/services/user.service";
import { userRepository } from "@/server/repositories/userRepository";
import { ValidationError } from "@/server/errors/validation.error";

vi.mock("@/server/repositories/userRepository", () => ({
    userRepository: {
        upsert: vi.fn(),
    },
}));

const mockedUpsert = vi.mocked(userRepository.upsert);

beforeEach(() => {
    vi.clearAllMocks();
});

describe("UserService.upsertSampleUser", () => {
    it("ログインできないpasswordHashと認証済みの日時を付けて、固定idでupsertする", async () => {
        await UserService.upsertSampleUser("sample-user-01", {
            email: "sample-user-01@yakurabe.invalid",
            username: "サンプルユーザー",
        });

        expect(mockedUpsert).toHaveBeenCalledWith("sample-user-01", {
            email: "sample-user-01@yakurabe.invalid",
            username: "サンプルユーザー",
            passwordHash: LOGIN_DISABLED_PASSWORD_HASH,
            emailVerified: new Date("2026-10-01T00:00:00.000Z"),
        });
    });

    it(".invalid以外のメールアドレスはValidationErrorを投げる", async () => {
        await expect(
            UserService.upsertSampleUser("sample-user-01", {
                email: "sample@example.com",
                username: "サンプルユーザー",
            })
        ).rejects.toThrow(ValidationError);
        expect(mockedUpsert).not.toHaveBeenCalled();
    });
});
