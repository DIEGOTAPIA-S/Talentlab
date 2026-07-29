-- Esquema Inicial: TalentLab (PostgreSQL / Supabase)
-- =========================================================

-- Habilitar extensión pgcrypto para generación de UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Instituciones (B2B Tenants)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    dominio VARCHAR(255) UNIQUE NOT NULL,
    plan_suscripcion VARCHAR(50) CHECK (plan_suscripcion IN ('basic', 'premium')) DEFAULT 'basic',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Usuarios (Estudiantes, Mentores, Administradores)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) CHECK (role IN ('admin_tenant', 'student', 'mentor')) NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Perfiles de Riesgo de Estudiantes (Semaforo de Deserción)
CREATE TABLE student_risk_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    probabilidad_desercion DECIMAL(3,2) CHECK (probabilidad_desercion >= 0.00 AND probabilidad_desercion <= 1.00),
    nivel_riesgo VARCHAR(20) CHECK (nivel_riesgo IN ('alto', 'medio', 'bajo')),
    factores_clave JSONB,
    ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Simulaciones de Entrevistas (Resultados NLP)
CREATE TABLE interview_simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    rol_objetivo VARCHAR(255),
    feedback_general TEXT,
    score_coherencia INTEGER CHECK (score_coherencia BETWEEN 1 AND 100),
    score_confianza INTEGER CHECK (score_confianza BETWEEN 1 AND 100),
    grabacion_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar rendimiento en queries B2B
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_risk_tenant ON student_risk_profiles(tenant_id);
CREATE INDEX idx_interviews_tenant ON interview_simulations(tenant_id);
CREATE INDEX idx_interviews_user ON interview_simulations(user_id);
