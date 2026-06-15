# ContratoIA

Generador de contratos legales con IA, adaptado a la legislación española.
Stack: HTML/CSS/JS vanilla + funciones serverless en Vercel + API de Claude + Stripe.

**Modelo de negocio:** el primer contrato es gratis (para siempre); a partir del segundo, 4,99 € por contrato (pago único, sin suscripción).

---

## Estructura

```
contratoia/
├── index.html              ← Landing + generador
├── css/styles.css          ← Estilos
├── js/app.js               ← Lógica: generador, paywall, PDF
├── api/
│   ├── generate.js         ← Proxy a la API de Claude (redacta el contrato)
│   ├── create-checkout.js  ← Crea la sesión de pago de Stripe (4,99 €)
│   └── verify-session.js   ← Verifica el pago contra Stripe (server-side)
├── package.json
├── vercel.json
└── .env.example
```

---

## Cómo se cobra (y por qué es seguro)

El control del "primer gratis" vive en `localStorage`. Si alguien lo burla, solo consigue
un contrato extra gratis (coste ~0,03 €): irrelevante.

Lo que **sí** está blindado es el cobro de los 4,99 €. La descarga de un contrato de pago
solo se desbloquea cuando `verify-session.js` confirma el pago **consultando directamente a
la API de Stripe** con el `session_id` real. Escribir `?paid=true` a mano no sirve, porque no
existe una sesión que Stripe confirme como pagada. Ese es el agujero clásico que aquí queda cerrado.

---

## Despliegue (paso a paso)

### 1. Sube el proyecto a GitHub
```bash
cd contratoia
git init
git add .
git commit -m "ContratoIA inicial"
git branch -M main
git remote add origin https://github.com/jcaogarci/contratoia.git
git push -u origin main
```

### 2. Conecta el repo a Vercel
- Entra en vercel.com → **Add New → Project** → importa `contratoia`.
- Framework Preset: **Other** (no es Next.js).
- No toques el build; despliega.

### 3. Configura las variables de entorno en Vercel
En el proyecto → **Settings → Environment Variables**, añade:

| Nombre | Valor |
|---|---|
| `ANTHROPIC_API_KEY` | tu clave `sk-ant-...` |
| `STRIPE_SECRET_KEY` | tu clave `sk_test_...` (pruebas) o `sk_live_...` (producción) |

Después, **Deployments → Redeploy** para que tomen efecto.

### 4. Prueba el flujo
1. Genera tu primer contrato → debe descargarse gratis.
2. Genera un segundo → aparece el muro de pago.
3. Paga con la tarjeta de prueba de Stripe `4242 4242 4242 4242` (cualquier fecha futura y CVC).
4. Al volver, la descarga debe desbloquearse.

### 5. Pasar a producción
Cuando todo funcione en `sk_test_`, cambia `STRIPE_SECRET_KEY` por tu clave `sk_live_...`
en Vercel y vuelve a desplegar. Ya estás cobrando de verdad.

---

## Notas

- **No hace falta crear ningún producto ni precio en el panel de Stripe**: el importe (4,99 €)
  se define en línea en `create-checkout.js` (`price_data`).
- El modelo usado para redactar es `claude-sonnet-4-6` (buen equilibrio calidad/coste).
  Puedes bajarlo a Haiku para abaratar, o subirlo a Opus para máxima calidad, en `api/generate.js`.
- Coste por contrato generado: ~0,03 €. Precio al usuario: 4,99 €. Margen ≈ 99 %.

---

## Aviso legal

ContratoIA es una herramienta de generación automática de documentos. No presta asesoramiento
jurídico ni sustituye el criterio de un profesional. Para operaciones complejas o de alto importe,
conviene que un abogado revise el documento antes de firmarlo.
