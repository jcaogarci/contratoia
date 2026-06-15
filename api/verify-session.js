// api/verify-session.js
// Verifica un pago contra la propia API de Stripe usando el session_id.
// Esta es la pieza que protege el ingreso: la descarga del contrato SOLO debe
// desbloquearse cuando este endpoint devuelve { paid: true }.
// Falsificar ?paid=true en la URL no sirve, porque aquí se consulta a Stripe
// con el session_id real y se comprueba payment_status === 'paid'.
//
// Requiere la variable de entorno STRIPE_SECRET_KEY en Vercel.

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  const sessionId =
    (req.query && req.query.session_id) ||
    (req.body && req.body.session_id);

  if (!sessionId) {
    return res.status(400).json({ paid: false, error: 'Falta session_id' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid = session.payment_status === 'paid';
    return res.status(200).json({ paid });
  } catch (err) {
    console.error('verify-session error:', err);
    return res.status(500).json({ paid: false, error: 'No se pudo verificar el pago' });
  }
}
