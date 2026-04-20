
import { PrismaClient } from "@/generated/prisma/client";
import { adapter } from "@/lib/prisma";
import { genSaltSync, hashSync } from "bcrypt";

export default class UserSeeder {
  static async run() {
    const prisma = new PrismaClient({
      adapter,
      log: ["query", "info", "warn", "error"],
    });

    console.log("[..] seed user started");

    try {
      const check = await prisma.user.findFirst();

      if (check) {
        console.log("[X] user already exists. skipping seed user");
        return;
      }

      const salt = genSaltSync(10);

      await prisma.user.create({
        data: {
          name: "admin",
          password: hashSync("12345678", salt),
          email: "admin@example.com",
          is_verified: true,
        },
      });

      console.log("[✓] seed user completed");
    } catch (err) {
      console.error("[!] seed user failed:", err);
      throw err;
    } finally {
      await prisma.$disconnect();
    }
  }
}