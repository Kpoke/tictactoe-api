import { login } from "../../services/login";
import { UserModel } from "../../model/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

jest.mock("../../model/User");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");

describe("login service", () => {
  const mockUser = {
    id: "user-123",
    username: "testuser",
    password: "hashedpassword",
    points: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-secret-key-minimum-32-characters-long";
  });

  it("should return a JWT token for valid credentials", async () => {
    (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue("mock-jwt-token");

    const token = await login("password123", mockUser as any);

    expect(bcrypt.compare).toHaveBeenCalledWith("password123", "hashedpassword");
    expect(jwt.sign).toHaveBeenCalledWith({ userId: "user-123" }, expect.any(String), {
      expiresIn: "7d",
    });
    expect(token).toBe("mock-jwt-token");
  });

  it("should throw error for invalid password", async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(login("wrongpassword", mockUser as any)).rejects.toThrow("Invalid username or password");
  });
});
