import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createServerClient } from "@supabase/ssr";
import { serialize } from "cookie";

// El Rate Limit se inicializará de forma segura dentro del handler

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Identificador para el Rate Limit (puede ser la IP o el ID del usuario)
  const identifier = req.headers['x-forwarded-for'] || 'anonymous';
  
  // Validar Rate Limit (Opcional, por si aún no configuras Upstash)
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });

      const ratelimit = new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(5, "1 m"),
        analytics: true,
      });

      const { success, limit, remaining, reset } = await ratelimit.limit(identifier);
      
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', reset);

      if (!success) {
        console.warn(`Rate limit excedido para IP: ${identifier}`);
        return res.status(429).json({ 
          error: 'Too Many Requests',
          message: 'Has excedido el límite de creación de pedidos. Intenta nuevamente en un minuto.'
        });
      }
    } catch (redisError) {
      console.error('Error al conectar con Upstash Redis (Rate Limit saltado):', redisError.message);
    }
  } else {
    console.warn('Upstash no está configurado. Rate limiting desactivado.');
  }

  // BOLA Protection: Leer la sesión de forma segura desde las Cookies HttpOnly
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return Object.keys(req.cookies || {}).map((name) => ({ name, value: req.cookies[name] }));
      },
      setAll(cookiesToSet) {
        const serializedCookies = cookiesToSet.map(({ name, value, options }) => {
          return serialize(name, value, {
            ...options,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
          });
        });
        res.setHeader('Set-Cookie', serializedCookies);
      },
    },
  });

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing session cookie' });
  }

  try {
    const { items, customer, notes } = req.body;

    // Aquí iría la lógica de inserción del pedido en Supabase
    // Debido a que inicializamos Supabase con la cookie segura, el RLS (Row Level Security) se aplica automáticamente.
    
    // Ejemplo de inserción asumiendo tabla "pedidos"
    /*
    const { data, error } = await supabase.from('pedidos').insert({
      user_id: user.id, // BOLA Protection: Forzar que el pedido pertenezca al usuario autenticado
      customer_info: customer,
      items: items,
      notes: notes,
      status: 'borrador'
    }).select();

    if (error) throw error;
    */

    return res.status(200).json({ 
      success: true, 
      message: 'Pedido recibido con éxito (Protegido por Rate Limit y BOLA)',
      user_id: user.id
    });

  } catch (error) {
    console.error('Error creando pedido:', error);
    return res.status(500).json({ error: 'Failed to create order' });
  }
}
