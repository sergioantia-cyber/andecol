import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createClient } from "@supabase/supabase-js";

// Inicializar Redis para Upstash
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Limitar a 5 peticiones por minuto por IP/Usuario
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Identificador para el Rate Limit (puede ser la IP o el ID del usuario)
  const identifier = req.headers['x-forwarded-for'] || 'anonymous';
  
  // Validar Rate Limit
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

  // BOLA Protection: Validar la sesión del usuario enviada en los headers
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  // Inicializar Supabase con el Service Role para escritura segura si fuera necesario
  // pero usando el JWT del usuario para respetar RLS
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader // Pasar el token del usuario al backend de Supabase
      }
    }
  });

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  try {
    const { items, customer, notes } = req.body;

    // Aquí iría la lógica de inserción del pedido en Supabase
    // Debido a que inicializamos Supabase pasándole el Authorization Header del usuario,
    // el RLS (Row Level Security) se aplica automáticamente.
    
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
      message: 'Pedido recibido con éxito (Simulado para pruebas de seguridad)',
      user_id: user.id
    });

  } catch (error) {
    console.error('Error creando pedido:', error);
    return res.status(500).json({ error: 'Failed to create order' });
  }
}
