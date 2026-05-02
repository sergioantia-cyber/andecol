import { createServerClient } from '@supabase/ssr';
import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return res.status(401).json({ user: null });
  }

  return res.status(200).json({ user: data.user });
}
