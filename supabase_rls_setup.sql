-- Activar RLS en las tablas principales (si no estaban activadas ya)
ALTER TABLE product_profiles ENABLE ROW LEVEL SECURITY;
-- Asumo que tienes una tabla "pedidos" o "orders". Reemplaza con tu nombre real.
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- POLÍTICAS PARA: product_profiles
-- ==========================================
-- Permitir lectura a cualquier usuario autenticado (o anónimo si tu catálogo es público)
CREATE POLICY "Permitir lectura pública de perfiles"
ON product_profiles FOR SELECT
USING (true); -- Cambia a (auth.role() = 'authenticated') si el catálogo es privado

-- Permitir que solo los usuarios autenticados inserten o modifiquen,
-- idealmente validando que tengan un rol de 'empleado' o superior, pero 
-- como base mínima, exigimos que estén autenticados.
CREATE POLICY "Solo usuarios autenticados pueden modificar perfiles"
ON product_profiles FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- ==========================================
-- EJEMPLO DE POLÍTICAS PARA TABLA "pedidos" (Anti-BOLA)
-- ==========================================
-- Suponiendo que la tabla se llama "pedidos" y tiene una columna "user_id"
-- CREATE POLICY "Usuarios solo pueden ver sus propios pedidos"
-- ON pedidos FOR SELECT
-- USING (auth.uid() = user_id);

-- CREATE POLICY "Usuarios solo pueden insertar sus propios pedidos"
-- ON pedidos FOR INSERT
-- WITH CHECK (auth.uid() = user_id);

-- CREATE POLICY "Usuarios solo pueden actualizar sus propios pedidos"
-- ON pedidos FOR UPDATE
-- USING (auth.uid() = user_id)
-- WITH CHECK (auth.uid() = user_id);
