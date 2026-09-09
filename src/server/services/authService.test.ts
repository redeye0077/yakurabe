import { describe, it, expect, vi, beforeEach } from "vitest";
import type { User } from "@prisma/client";
import { authService } from "@/server/services/authService";
import { userRepository } from "@/server/repositories/userRepository";
import { hashPassword, verifyPassword } from "@/lib/password";

vi.mock("@/server/repositories/userRepository", () => ({
    userRepository: {
        findByEmail: vi.fn(),
        create: vi.fn(),
    },
}));

vi.mock("@/lib/password", () => ({
    hashPassword: vi.fn(),
    verifyPassword: vi.fn(),
}));

const mockedFindByEmail = vi.mocked(userRepository.findByEmail);
const mockedCreate = vi.mocked(userRepository.create);
const mockedHash = vi.mocked(hashPassword);
const mockedVerify = vi.mocked(verifyPassword);

function createMockUser(overrides: Partial<User> = {}): User {
    return {
        id: "id-1",
        username: "testuser",
        email: "test@example.com",
        passwordHash: "hashed",
        avatarUrl: null,
        bio: null,
        dartsCareer: null,
        highestRating: null,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("authService.register", () => {
    const input = {
        email: "test@example.com",
        password: "Password123!",
        username: "testuser",
    };

    it("既存ユーザーがいる場合はエラーを投げる", async () => {
        mockedFindByEmail.mockResolvedValue(
            createMockUser({ id: "existing-id", email: input.email, username: "existing" })
        );

        await expect(authService.register(input)).rejects.toThrow(
            "このメールアドレスは既に登録されています"
        );

        expect(mockedHash).not.toHaveBeenCalled();
        expect(mockedCreate).not.toHaveBeenCalled();
    });

    it("重複がなければハッシュ化してユーザーを作成し、passwordHashを含まない値を返す", async () => {
        mockedFindByEmail.mockResolvedValue(null);
        mockedHash.mockResolvedValue("hashed-password");
        mockedCreate.mockResolvedValue(
            createMockUser({
                id: "new-id",
                email: input.email,
                username: input.username,
                passwordHash: "hashed-password",
            })
        );

        const result = await authService.register(input);

        expect(mockedHash).toHaveBeenCalledWith(input.password);
        expect(mockedCreate).toHaveBeenCalledWith({
            email: input.email,
            passwordHash: "hashed-password",
            username: input.username,
        });
        expect(result).toEqual({
            id: "new-id",
            email: input.email,
            username: input.username,
        });
        expect(result).not.toHaveProperty("passwordHash");
    });
});

describe("authService.validateCredentials", () => {
    it("ユーザーが存在しない場合はnullを返す", async () => {
        mockedFindByEmail.mockResolvedValue(null);

        const result = await authService.validateCredentials(
            "notfound@example.com",
            "anything"
        );

        expect(result).toBeNull();
        expect(mockedVerify).not.toHaveBeenCalled();
    });

    it("パスワードが一致しない場合はnullを返す", async () => {
        mockedFindByEmail.mockResolvedValue(createMockUser());
        mockedVerify.mockResolvedValue(false);

        const result = await authService.validateCredentials(
            "test@example.com",
            "wrong-password"
        );

        expect(result).toBeNull();
    });

    it("パスワードが一致する場合はpasswordHashを除いたユーザー情報を返す", async () => {
        mockedFindByEmail.mockResolvedValue(createMockUser());
        mockedVerify.mockResolvedValue(true);

        const result = await authService.validateCredentials(
            "test@example.com",
            "correct-password"
        );

        expect(result).toEqual({
            id: "id-1",
            email: "test@example.com",
            username: "testuser",
        });
        expect(result).not.toHaveProperty("passwordHash");
    });
});
