import { createSession, SessionData } from '@/lib/session';
import { httpServer, TResponse } from '@/lib/httpServer';
import { response } from 'express';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Joi from 'joi';
import { validate } from '@/lib/validator';
import { prisma } from '@/lib/prisma';
import { comparePassword } from '@/lib/bcrypt';
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required()
})
export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { email, password } = validate<{ email: string, password: string }>(
      loginSchema,
      body
    )
    const user = await prisma.user.findFirst({
      where: {
        email,
      }
    })
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 })
    const valid = await comparePassword(password, user.password)
    if (!valid) {
      return NextResponse.json({ message: "Invalid Password" }, { status: 400 })
    }
    const payload: SessionData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
    };
    await createSession(payload);
    return NextResponse.json(
      { message: 'Login Success' },
    );
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: error.message || 'Server Error' }, { status: 500 });
  }
}
