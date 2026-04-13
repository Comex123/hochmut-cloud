export const jsonResponse = (payload, status = 200, extraHeaders = {}) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });

export const jsonError = (message, status = 400) => jsonResponse({ error: message }, status);

export const redirectResponse = (location, headers = {}, status = 302) =>
  (() => {
    const responseHeaders = new Headers(headers);
    responseHeaders.set("Location", location);
    return new Response(null, {
      status,
      headers: responseHeaders,
    });
  })();

export const requestOrigin = (request) => new URL(request.url).origin;

export const absoluteUrl = (origin, value) => {
  if (!value) {
    return "";
  }

  try {
    return new URL(value, origin).toString();
  } catch {
    return "";
  }
};
