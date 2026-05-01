import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers as nextHeaders } from 'next/headers';
import { httpServer } from '@/lib/httpServer';

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ backend: string[] }> },
) {
  try {
    const { backend } = await params;
    const path = backend.join('/');
    const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/${path}${req.nextUrl.search}`;
    const method = req.method;
    // const headers = await nextHeaders();
    const headers = new Headers();
    headers.append('x-api-key', process.env.NEXT_PUBLIC_BACKEND_API_KEY!);
    let body: BodyInit | null = null;
    if (
      method === 'POST' ||
      method === 'PUT' ||
      method === 'PATCH' ||
      method === 'DELETE'
    ) {
      const contentType = req.headers.get('content-type') || '';

      if (contentType.includes('multipart/form-data')) {
        const formData = await req.formData();

        const externalFormData = new FormData();
        formData.forEach((value, key) => {
          if (value instanceof File) {
            externalFormData.append(key, value);
          } else {
            externalFormData.append(key, value.toString());
          }
        });

        body = externalFormData;
        headers.delete('content-type');
      } else if (contentType.includes('application/json')) {
        try {
          const json = await req.json();
          body = JSON.stringify(json);
        } catch (err) {
          console.error('Invalid JSON body', err);
          body = null;
        }
        headers.append('Content-Type', 'application/json');
      } else {
        body = await req.text();
      }
    }
    const externalRes = await fetch(url, {
      method,
      headers,
      body,
    });
    const responseBody = await externalRes.json();
    const resHeaders = new Headers(externalRes.headers);
    resHeaders.delete('content-length');
    resHeaders.delete('content-encoding');

    return NextResponse.json(responseBody, {
      status: externalRes.status,
      headers: resHeaders,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as DELETE,
  handler as PATCH,
};
