// api/create-checkout.js
// Crea una sesión de Stripe Checkout para el pago único de un contrato (4,99 €).
// No necesita producto ni precio precreados: el importe se define aquí (price_data).
//
// Requiere la variable de entorno STRIPE_SECRET_KEY en Vercel.
// Si tu api/generate.js usa CommonJS (const X = require('...')), cambia los
// import/export de abajo por require/module.exports para mantener consistencia.

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const origin = req.headers.origin || `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'ContratoIA — Contrato adicional',
              description: 'Generación y descarga de un contrato',
            },
            unit_amount: 499, // 4,99 € en céntimos
          },
          quantity: 1,
        },
      ],
      // Stripe sustituye {CHECKOUT_SESSION_ID} por el id real al redirigir de vuelta
      success_url: `${origin}/?paid=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?paid=false`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('create-checkout error:', err);
    return res.status(500).json({ error: 'No se pudo iniciar el pago' });
  }
}
