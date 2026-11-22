export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const token = process.env.KOBO || process.env.KOBO_API_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: 'Kobo API token not configured' }), {
      status: 500,
      headers: {
        'content-type': 'application/json',
      },
    });
  }

  const url = new URL(request.url);
  const rawLimit = parseInt(url.searchParams.get('limit') || '1000', 10);
  const rawStart = parseInt(url.searchParams.get('start') || '0', 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 1000) : 1000;
  const start = Number.isFinite(rawStart) ? Math.max(rawStart, 0) : 0;

  const targetUrl = `https://kobo.unocha.org/api/v2/assets/a4AhiiXAhSZTwutXt2jTY3/data.json?limit=${limit}&start=${start}`;

  try {
    const koboRes = await fetch(targetUrl, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });

    const data = await koboRes.text();
    return new Response(data, {
      status: koboRes.status,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'public, max-age=180, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        'content-type': 'application/json',
      },
    });
  }
}
