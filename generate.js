// api/generate.js
// Proxy a la API de Anthropic que redacta el contrato.
// La API key vive solo en el servidor (variable de entorno ANTHROPIC_API_KEY).
//
// Requiere la variable de entorno ANTHROPIC_API_KEY en Vercel.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Falta ANTHROPIC_API_KEY en el servidor' });
  }

  try {
    const { typeName, roles, freeText, partyA, partyB, details } = req.body || {};

    const fmtParty = (p, role) => {
      if (!p || !p.nombre) return `- ${role}: (sin especificar)`;
      const bits = [p.nombre];
      if (p.dni) bits.push(`DNI/NIF ${p.dni}`);
      if (p.domicilio) bits.push(`domicilio en ${p.domicilio}`);
      return `- ${role}: ${bits.join(', ')}`;
    };

    const detailLines = details && Object.keys(details).length
      ? Object.entries(details)
          .filter(([, v]) => v && String(v).trim())
          .map(([k, v]) => `- ${k}: ${v}`)
          .join('\n')
      : '(sin detalles adicionales)';

    const userPrompt = `Redacta un contrato completo del tipo: ${typeName || 'Contrato a medida'}.

PARTES:
${fmtParty(partyA, (roles && roles[0]) || 'Parte A')}
${fmtParty(partyB, (roles && roles[1]) || 'Parte B')}

DETALLES DEL ACUERDO:
${detailLines}
${freeText ? `\nDESCRIPCIÓN ADICIONAL DEL USUARIO:\n${freeText}` : ''}

Genera el contrato ahora, completo y listo para firmar.`;

    const systemPrompt = `Eres un asistente jurídico experto en redacción de contratos conforme a la legislación española vigente (Código Civil, Ley de Arrendamientos Urbanos, Código de Comercio y normativa aplicable según el tipo de contrato).

Redacta contratos profesionales, claros y jurídicamente sólidos. Sigue SIEMPRE esta estructura:

1. Encabezado con lugar y fecha (usa "[Lugar]" y la fecha actual si no se indica).
2. REUNIDOS — identificación completa de las partes.
3. INTERVIENEN — en qué calidad actúa cada parte.
4. EXPONEN — antecedentes y voluntad de contratar.
5. CLÁUSULAS — numeradas (PRIMERA, SEGUNDA, …), cada una con un título y su contenido. Incluye las cláusulas propias del tipo de contrato y, además, las habituales: duración, obligaciones de las partes, incumplimiento, protección de datos (RGPD/LOPDGDD), legislación aplicable y jurisdicción competente.
6. Cierre y espacio de firma para ambas partes.

Reglas:
- Usa los datos proporcionados. Si falta algún dato no esencial, deja un hueco claro entre corchetes, p. ej. "[importe]".
- Lenguaje jurídico correcto pero comprensible.
- Devuelve SOLO el texto del contrato, en texto plano, sin markdown, sin comentarios ni explicaciones antes o después.`;

    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error('Anthropic error:', apiRes.status, errText);
      return res.status(502).json({ error: 'Error al generar el contrato' });
    }

    const data = await apiRes.json();
    const contract = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n')
      .trim();

    if (!contract) return res.status(502).json({ error: 'Respuesta vacía' });

    return res.status(200).json({ contract });
  } catch (err) {
    console.error('generate error:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}
