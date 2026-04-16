import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "./serverSession";
export type TAuthUser = {
  user: {
    id: number;
    name: string;
    email: string;
  }
}
export async function authGuard(req: NextRequest) {
  // const apiKey = req.headers.get("x-api-key");

  // API KEY AUTH
  // if (apiKey && VALID_API_KEYS.includes(apiKey)) {
  //   return {
  //     authorized: true,
  //     apiKey,
  //     user: null,
  //   };
  // }

  // SESSION AUTH
  const session = await getServerSession();

  if (session?.user) {
    return {
      authorized: true,
      user: session.user,
      apiKey: null,
    };
  }

  return {
    authorized: false,
  };
}

export function withAuth<TParams = {}>(
  handler: (
    req: NextRequest,
    auth: TAuthUser,
    context: { params: TParams }
  ) => Promise<NextResponse | void> | NextResponse
) {
  return async (req: NextRequest, context: { params: Promise<TParams> }) => {
    const auth = await authGuard(req);

    if (!auth.authorized) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    // ✅ auto resolve params (if it's a Promise)
    const resolvedParams = await context.params

    return handler(req, auth as TAuthUser, {
      ...context,
      params: resolvedParams,
    })
  };
}