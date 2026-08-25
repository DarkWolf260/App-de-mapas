export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const url = new URL(request.url);
  const limit = url.searchParams.get('limit') || '100';
  const start = url.searchParams.get('start') || '0';
  const token = process.env.VITE_KOBOTOOLBOX_KEY || '6fbdfea0d2369d401459bf9a3a9fed106b456015';

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
        'access-control-allow-origin': '*',
        'cache-control': 'public, max-age=180, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
      },
    });
  }
}
