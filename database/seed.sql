-- 1. Insertar Tenant (Institución de prueba)
INSERT INTO tenants (id, nombre, dominio) 
VALUES ('00000000-0000-0000-0000-000000000001', 'SENA Centro de Tecnologías', 'sena.edu.co') 
ON CONFLICT DO NOTHING;

-- 2. Insertar Usuarios
INSERT INTO users (id, tenant_id, email, role, nombre_completo) 
VALUES 
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'director@talentlab.edu', 'admin_tenant', 'Patricia Gómez Salazar'),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'estudiante@talentlab.edu', 'student', 'Diego Tapia');

-- 3. Insertar Perfiles de Riesgo de Estudiantes (Para probar el dashboard)
INSERT INTO student_risk_profiles (user_id, tenant_id, probabilidad_desercion, nivel_riesgo, factores_clave) 
VALUES 
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 0.85, 'alto', '{"factor": "Económico (Transporte)", "nombre_estudiante": "Diego Tapia", "programa": "Tecnólogo en ADSO"}'::jsonb),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 0.20, 'bajo', '{"factor": "Estable", "nombre_estudiante": "Camila Restrepo", "programa": "Diseño Gráfico Digital"}'::jsonb);
