import { createServerClient } from '@supabase/ssr';
import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, password } = req.body;

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return Object.keys(req.cookies || {}).map((name) => ({ name, value: req.cookies[name] }));
      },
      setAll(cookiesToSet) {
        // En Vercel Serverless (Express-like), configurar cookies vía Set-Cookie headers
        const serializedCookies = cookiesToSet.map(({ name, value, options }) => {
          return serialize(name, value, {
            ...options,
            httpOnly: true, // ¡VITAL! Protección contra XSS
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
          });
        });
        res.setHeader('Set-Cookie', serializedCookies);
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res.status(401).json({ error: error.message });
  }

  return res.status(200).json({ success: true, user: data.user });
}
