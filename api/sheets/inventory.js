export default async function handler(req, res) {
  // Solo permitir peticiones GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { sheetId } = req.query;

  if (!sheetId) {
    return res.status(400).json({ error: 'Missing sheetId parameter' });
  }

  // ALLOWED_SHEET_IDS debe ser una cadena separada por comas en Vercel
  // Ejemplo: "1VpPu3RV4owV8GeFeultha-93ldNrSJEq,OtroIdAca"
  const allowedIdsString = process.env.ALLOWED_SHEET_IDS || '1VpPu3RV4owV8GeFeultha-93ldNrSJEq'; // Default temporal para desarrollo local
  const allowedIds = allowedIdsString.split(',').map(id => id.trim());

  // Validación estricta (Anti-SSRF)
  if (!allowedIds.includes(sheetId)) {
    console.warn(`Intento de acceso SSRF bloqueado para el ID: ${sheetId}`);
    return res.status(403).json({ error: 'Forbidden: Sheet ID not in allow-list' });
  }

  try {
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    const response = await fetch(sheetUrl);

    if (!response.ok) {
      throw new Error(`Google Sheets API responded with status ${response.status}`);
    }

    const csvData = await response.text();

    // Configurar headers para devolver CSV
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate'); // Cachear por 60 seg en Vercel Edge
    
    return res.status(200).send(csvData);

  } catch (error) {
    console.error('Error fetching sheet:', error);
    return res.status(500).json({ error: 'Failed to fetch inventory data' });
  }
}
