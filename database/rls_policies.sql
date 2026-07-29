-- Políticas RLS (Row-Level Security) de Supabase para Aislamiento B2B
-- =========================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_risk_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_simulations ENABLE ROW LEVEL SECURITY;

-- 1. Políticas para Usuarios (Users)
-- Un administrador de tenant solo puede ver a los usuarios de su propia institución
CREATE POLICY "Tenant admin can view their users"
ON users
FOR SELECT
USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid() AND role = 'admin_tenant'
));

-- Un usuario puede verse a sí mismo
CREATE POLICY "Users can view themselves"
ON users
FOR SELECT
USING (id = auth.uid());

-- 2. Políticas para Perfiles de Riesgo (Student Risk Profiles)
-- Administradores pueden ver el riesgo de todos los estudiantes de su tenant
CREATE POLICY "Admins can view tenant risk profiles"
ON student_risk_profiles
FOR SELECT
USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid() AND role = 'admin_tenant'
));

-- Estudiantes NO pueden ver sus propios perfiles de riesgo directamente (solo a través de mentores/admin)

-- 3. Políticas para Simulaciones (Interview Simulations)
-- Estudiantes pueden ver e insertar sus propias simulaciones
CREATE POLICY "Students can view and create their own simulations"
ON interview_simulations
FOR ALL
USING (user_id = auth.uid());

-- Administradores pueden ver todas las simulaciones de su institución
CREATE POLICY "Admins can view tenant simulations"
ON interview_simulations
FOR SELECT
USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid() AND role = 'admin_tenant'
));
