-- ==============================================================================
-- PROYECTO PRODUCTIVO: TALENTLAB (SENA - TECNOLOGÍA EN ADSO - FICHA 2996897)
-- AUTOR: DIEGO ALFONSO TAPIA SALAZAR
-- SCRIPT DDL COMPATIBLE CON MYSQL WORKBENCH (DIAGRAMA ENTIDAD-RELACIÓN / EER)
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS talentlab_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE talentlab_db;

-- 1. Tabla de Instituciones Educativas (Tenants B2B)
CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(36) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    dominio VARCHAR(255) NOT NULL UNIQUE,
    plan_suscripcion ENUM('basic', 'premium', 'social_sena') DEFAULT 'basic',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Tabla de Usuarios (Estudiantes, Mentores y Administradores)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role ENUM('admin_tenant', 'student', 'mentor') NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Tabla de Perfiles de Riesgo de Estudiantes (Semáforo de Deserción y ML)
CREATE TABLE IF NOT EXISTS student_risk_profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    tenant_id VARCHAR(36) NOT NULL,
    asistencia DECIMAL(5,2) DEFAULT 85.00,
    rendimiento_academico DECIMAL(5,2) DEFAULT 75.00,
    estrato INT DEFAULT 2,
    tiene_auxilio_financiero TINYINT(1) DEFAULT 0,
    probabilidad_desercion DECIMAL(3,2) NOT NULL,
    nivel_riesgo ENUM('alto', 'medio', 'bajo') NOT NULL,
    factores_clave JSON NULL,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_risk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_risk_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Tabla de Planes de Apoyo y Permanencia Institucional
CREATE TABLE IF NOT EXISTS support_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    assigned_to VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    tipo_apoyo ENUM('Económico', 'Académico', 'Psicosocial') NOT NULL,
    progress INT DEFAULT 0,
    status ENUM('Pendiente', 'En Progreso', 'Completado') DEFAULT 'En Progreso',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_support_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_support_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Tabla de Simulaciones de Entrevista Laboral con IA
CREATE TABLE IF NOT EXISTS interview_simulations (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    tenant_id VARCHAR(36) NOT NULL,
    rol_objetivo VARCHAR(255) DEFAULT 'Desarrollador Junior',
    feedback_general TEXT,
    score_coherencia INT CHECK (score_coherencia BETWEEN 0 AND 100),
    score_confianza INT CHECK (score_confianza BETWEEN 0 AND 100),
    grabacion_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_interviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_interviews_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Índices de Optimización para Consultas Multi-tenant
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_risk_tenant ON student_risk_profiles(tenant_id);
CREATE INDEX idx_interviews_user ON interview_simulations(user_id);
