export const config = {
  runtime: 'edge',
};

const KOBO_QUERY = encodeURIComponent(JSON.stringify({ 'modulo1/Estado': 'La_Guaira' }));
const KOBO_FIELDS = encodeURIComponent(
  JSON.stringify([
    '_id',
    '_geolocation',
    '_submission_time',
    'modulo1/Estado',
    'modulo1/Municipio',
    'modulo1/Parroquia',
    'modulo1/Fecha',
    'group_zw4ob28/_3_1_Nombre_de_la_edificaci_n',
    'group_pa3ko43/_2_1_Nombre_de_la_Ins_n_o_Consejo_Comunal',
    'group_jc0wd35/_4_1_Indique_el_uso_de_la_edifi',
    'group_hr7mg21/_5_1_Indique_el_tipo_de_estructura',
    'group_zo0ds00/_11_1_Identificar_el_sgo_mas_desfavorable',
    'group_zo0ds00/_11_2_OBSERVACIONES',
    'modulo6/Etiqueta_o_Riesgo',
    'group_vy1eb97/Riesgo_de_edificios_aleda_os',
    'modulo6/_6_1_Riesgo_o_dictamen',
  ])
);

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

  const targetUrl = `https://kobo.unocha.org/api/v2/assets/a4AhiiXAhSZTwutXt2jTY3/data.json?limit=${limit}&start=${start}&query=${KOBO_QUERY}&fields=${KOBO_FIELDS}`;

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
