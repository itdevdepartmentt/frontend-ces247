import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  // 1. Generate a random nonce
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
  // Ambil origin: "http://localhost:3000/api" → "http://localhost:3000"
  const apiOrigin = apiUrl ? new URL(apiUrl).origin : "";

  // 2. Define a strict CSP using the nonce
  // Note: 'strict-dynamic' helps automate trust for legitimate sub-scripts
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'unsafe-eval' 'strict-dynamic';
    style-src 'self' 'unsafe-inline' 'nonce-${nonce}'
      'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='
      'sha256-CIxDM5jnsGiKqXs2v7NKCY5MzdR9gu6TtiMJrDw29AY='
      'sha256-vGQdhYJbTuF+M8iCn1IZCHpdkiICocWHDq4qnQF4Rjw='
      'sha256-4GzqRlwcGp7cD3kANBs5f/CO/iqLwfJq0WYAq59xN6E='
      'sha256-OpIODBPkpoiPLrmWVWQAuUTdbHmO2qBKzuQ9qR3th9M='
      'sha256-UAihfItDa9VybE65LGSN8u3Hsk+Obut4I2HMuUxGIAU='
      'sha256-sYNsYvb9ed9Vsz/maFvMg1z3paljupR1kTQv+ihh3cM='
      'sha256-1Rgj9Tmw9SU4h9nklK6l294O2abdhNs1l+3ZoCwzxUA='
      'sha256-F6SKLtWtm7VErmrq0jDQtzJvpz6+LcrSfbyczc2xd6o='
      'sha256-+OZewf8eCqvkslh1/Xykl0aVXjayV2Iy+vePINuzTcE='
      'sha256-CHox7CF+XF5itK7YJMt8fpMltQv4/krVGqYhlFzvJys='
      'sha256-mie6WmUG3QwG7eOyDWBx8Bce20N/LdzUH4Zq20+Xuac='
      'sha256-YRU82gRq3tqvclIjICrc9UXxYBl+iOGd7Vv7bhPhyTQ='
      'sha256-tzBMNZ7l8nZ/8oEITbEGeJAgNHg7KpJOduvhc+LO138='
      'sha256-EGxSJ+22silg1bQ9JENEw9K11R7B+X79u4xwD5Qlxik='
      'sha256-h/GKjXBq1QiwvO1y7p0JkvVZk4w7xTPz2rn2eswXu3k='
      'sha256-sHwQzC2ZsVrt1faUYCjF/eo8aIoBlQbGjVstzanL9CU='
      'sha256-WjBwDsyVeYZp1bK5jTu7D4KrA/IMa4ddhGMJxlQ1td0='
      'sha256-XbNwOSjMIgSNj3ewh1FPDgy/T33iTuvdeceTh/VSFZg='
      'sha256-nzTgYzXYDNe6BAHiiI7NNlfK8n/auuOAhh2t92YvuXo='
      'sha256-441zG27rExd4/il+NvIqyL8zFx5XmyNQtE381kSkUJk='
      'sha256-PlumsSlvJ7vvWzjqibGAYKq92O3y/4JTxWWsWJvyUYA='
      ;
     img-src 'self' blob: data: ${apiOrigin};
    font-src 'self';
    connect-src 'self' ${apiOrigin};
    frame-src 'self' ${apiOrigin};
    frame-ancestors 'self';
    base-uri 'self';
    form-action 'self';
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.delete("X-Powered-By");
  return response;
}