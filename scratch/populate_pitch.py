import pptx
from pptx.util import Pt, Inches
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

prs = pptx.Presentation("PITCH PRESENTACIÓN FINAL.pptx")

FONT_NAME = "Josefin Sans"
COLOR_GREEN = RGBColor(0, 176, 80)     # #00B050 (SENA Green)
COLOR_DARK = RGBColor(50, 50, 50)       # #323232 (Dark Gray text)
COLOR_MUTED = RGBColor(120, 120, 120)   # #787878 (Timing notes)

def clear_and_populate(tf, items):
    tf.clear()
    for idx, (p_type, text, bold, italic, color, size, space_after) in enumerate(items):
        p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
        p.space_before = Pt(1)
        p.space_after = Pt(space_after)
        p.line_spacing = 1.05
        
        run = p.add_run()
        run.text = text
        run.font.name = FONT_NAME
        run.font.size = Pt(size)
        run.font.bold = bold
        run.font.italic = italic
        run.font.color.rgb = color

# ==================== SLIDE 1: PORTADA ====================
slide1 = prs.slides[0]
tf1 = slide1.shapes[1].text_frame
tf1.clear()
p1_1 = tf1.paragraphs[0]
r1_1 = p1_1.add_run()
r1_1.text = "PRESENTACIÓN FINAL: TALENTLAB S.A.S."
r1_1.font.name = FONT_NAME
r1_1.font.size = Pt(22)
r1_1.font.bold = True
r1_1.font.color.rgb = COLOR_GREEN

# Apprentice info box
info_shape = None
for s in slide1.shapes:
    if s.name == "ApprenticeInfoBox":
        info_shape = s
        break
if not info_shape:
    info_shape = slide1.shapes.add_textbox(Inches(1.6), Inches(0.65), Inches(8.5), Inches(0.8))
    info_shape.name = "ApprenticeInfoBox"

tf_info = info_shape.text_frame
tf_info.clear()
p_inf = tf_info.paragraphs[0]
r_inf = p_inf.add_run()
r_inf.text = "Sistema Predictivo de Retención y Entrenamiento con IA | ADSO Ficha 2996897\nAprendiz: Diego Alfonso Tapia Salazar | Instructor Líder: John Fernando Méndez Medina"
r_inf.font.name = FONT_NAME
r_inf.font.size = Pt(12)
r_inf.font.bold = True
r_inf.font.color.rgb = COLOR_DARK

# ==================== SLIDE 2: 1. ¿QUIÉN SOY YO? ====================
slide2 = prs.slides[1]
items_s2 = [
    ("heading", "Diego Alfonso Tapia Salazar", True, False, COLOR_GREEN, 16, 2),
    ("sub", "Tecnólogo en Análisis y Desarrollo de Software (ADSO) – SENA", True, False, COLOR_DARK, 13, 6),
    ("body", "• Perfil y Pasión: Desarrollador enfocado en soluciones tecnológicas que generen impacto social real mediante la inteligencia artificial y el análisis de datos.", False, False, COLOR_DARK, 12.5, 4),
    ("body", "• Mi Motivación: Durante mi formación viví de cerca cómo compañeros con enorme talento abandonaron sus carreras técnicas debido a dificultades socioeconómicas no atendidas a tiempo y falta de orientación laboral.", False, False, COLOR_DARK, 12.5, 4),
    ("body", "• Mi Propósito: Crear TalentLab como una herramienta de equidad y acompañamiento para que ninguna institución pierda estudiantes por falta de alertas tempranas.", False, False, COLOR_DARK, 12.5, 6),
    ("timing", "(Tiempo sugerido: 30 segundos)", False, True, COLOR_MUTED, 11, 0)
]
clear_and_populate(slide2.shapes[4].text_frame, items_s2)

# ==================== SLIDE 3: 2. ¿POSEEMOS PROBLEMAS? ====================
slide3 = prs.slides[2]
items_s3 = [
    ("stat", "¿Sabían que en Colombia más del 33% de los estudiantes técnicos y tecnológicos desertan antes de graduarse? (SPADIES / MEN)", True, False, COLOR_GREEN, 13.5, 6),
    ("heading", "Los 3 Dolores Críticos Identificados:", True, False, COLOR_DARK, 13, 4),
    ("body", "1. Deserción Silenciosa: Los factores de riesgo académico y socioeconómico se detectan cuando el estudiante ya abandonó el aula.", False, False, COLOR_DARK, 12, 3),
    ("body", "2. Brecha de Empleabilidad ('Job Readiness'): Los egresados carecen de entrenamiento real para superar entrevistas técnicas y blandas.", False, False, COLOR_DARK, 12, 3),
    ("body", "3. Desconexión con Egresados: La experiencia y capital social de los graduados se encuentra desarticulado y desaprovechado.", False, False, COLOR_DARK, 12, 4),
    ("body", "• Alternativas Actuales: Plataformas LMS (Moodle, Q10) meramente administrativas, sin analítica predictiva ni simuladores adaptados.", False, False, COLOR_DARK, 12, 6),
    ("timing", "(Tiempo sugerido: 1 minuto)", False, True, COLOR_MUTED, 11, 0)
]
clear_and_populate(slide3.shapes[4].text_frame, items_s3)

# ==================== SLIDE 4: 3. ¿A QUIÉN LE SIRVE LO QUE HAGO? ====================
slide4 = prs.slides[3]
items_s4 = [
    ("heading", "El Protagonista: Directores de Bienestar y Rectores", True, False, COLOR_GREEN, 14, 3),
    ("body", "• Cliente B2B (Decisor de Compra): Instituciones privadas de educación técnica, tecnológica e IES intermedias en Colombia.", False, False, COLOR_DARK, 12, 3),
    ("body", "• La Necesidad del Cliente: Evitar pérdidas millonarias en matrículas ($3M a $6M COP por alumno desertado) y asegurar la acreditación de calidad ante el MEN.", False, False, COLOR_DARK, 12, 4),
    ("heading", "Usuarios Finales y Beneficiarios (B2C):", True, False, COLOR_DARK, 13, 3),
    ("body", "• Estudiantes Activos: Reciben alertas tempranas, orientación preventiva y simulan entrevistas laborales con retroalimentación instantánea.", False, False, COLOR_DARK, 12, 3),
    ("body", "• Egresados: Canal activo de mentoría y networking formativo.", False, False, COLOR_DARK, 12, 4),
    ("heading", "Early Adopters:", True, False, COLOR_DARK, 12.5, 2),
    ("body", "• 80 IES técnicas y tecnológicas en Bogotá y Cundinamarca con alta deserción en los primeros 3 semestres.", False, False, COLOR_DARK, 12, 6),
    ("timing", "(Tiempo sugerido: 1 minuto)", False, True, COLOR_MUTED, 11, 0)
]
clear_and_populate(slide4.shapes[1].text_frame, items_s4)

# ==================== SLIDE 5: 4. ¿SE LE TIENE? ====================
slide5 = prs.slides[4]
items_s5 = [
    ("slogan", "\"Detecta. Prepara. Conecta.\" – Propuesta de Valor Única", True, False, COLOR_GREEN, 15, 6),
    ("heading", "Los 3 Pilares de la Plataforma TalentLab:", True, False, COLOR_DARK, 13.5, 4),
    ("body", "1. Semáforo Predictivo de Deserción: Algoritmo Random Forest de Machine Learning que analiza notas, asistencia y variables socioeconómicas en tiempo real.", False, False, COLOR_DARK, 12.5, 3),
    ("body", "2. Simulador de Entrevistas con IA: Asistente conversacional NLP que entrena habilidades técnicas y conductuales con feedback inmediato en español.", False, False, COLOR_DARK, 12.5, 3),
    ("body", "3. Red Multi-tenant de Mentorías: Matching inteligente entre estudiantes activos y egresados para mentoría guiada.", False, False, COLOR_DARK, 12.5, 4),
    ("heading", "Factor Innovador y Diferenciador:", True, False, COLOR_DARK, 13, 3),
    ("body", "• Plataforma unificada en la nube bajo arquitectura serverless (<$0.05 USD anual por alumno), 100% contextualizada al entorno colombiano.", False, False, COLOR_DARK, 12, 6),
    ("timing", "(Tiempo sugerido: 1 minuto)", False, True, COLOR_MUTED, 11, 0)
]
clear_and_populate(slide5.shapes[2].text_frame, items_s5)

# ==================== SLIDE 6: 5. ¿DÓNDE CABE UNO CABEN TODOS? ====================
slide6 = prs.slides[5]
items_s6 = [
    ("heading", "Oportunidad Comercial y Tamaño de Mercado", True, False, COLOR_GREEN, 14, 4),
    ("body", "• Tendencia Global y Local: El sector EdTech en LATAM crece a un ritmo superior al 15% anual (CAGR) impulsado por IA y analítica educativa.", False, False, COLOR_DARK, 12, 4),
    ("heading", "Dimensionamiento del Mercado:", True, False, COLOR_DARK, 13, 3),
    ("body", "• TAM: +300 Instituciones de educación superior y técnica en Colombia (~$2.500 millones COP anuales).", False, False, COLOR_DARK, 12, 2.5),
    ("body", "• SAM: 180 instituciones técnicas y tecnológicas del segmento intermedio privado.", False, False, COLOR_DARK, 12, 2.5),
    ("body", "• SOM (Meta 5 años): 80 instituciones foco en Bogotá y Región Andina; proyección de 68 licencias anuales activas al Año 5 (37,7% de penetración del SAM).", False, False, COLOR_DARK, 12, 4),
    ("heading", "Validación Primaria con Clientes:", True, False, COLOR_DARK, 12.5, 3),
    ("body", "• Encuesta a 100 actores clave: 86% considera indispensable el simulador de entrevistas con IA y 78% de directivos pagaría por el sistema predictivo de alertas.", False, False, COLOR_DARK, 12, 6),
    ("timing", "(Tiempo sugerido: 1 minuto)", False, True, COLOR_MUTED, 11, 0)
]
clear_and_populate(slide6.shapes[2].text_frame, items_s6)

# ==================== SLIDE 7: 6. ¿EN QUÉ VAMOS? ====================
slide7 = prs.slides[6]
items_s7 = [
    ("heading", "Trayecto Recorrido e Hitos del Proyecto", True, False, COLOR_GREEN, 14, 4),
    ("body", "1. Investigación y Validación: Estudio de mercado cuantitativo y cualitativo con 100 encuestas aplicadas a estudiantes y directivos.", False, False, COLOR_DARK, 12.5, 3.5),
    ("body", "2. Arquitectura y MVP Funcional: Desarrollo en stack moderno (Backend Django REST Framework, base relacional PostgreSQL/Supabase y Frontend en React).", False, False, COLOR_DARK, 12.5, 3.5),
    ("body", "3. Algoritmos de IA Calibrados: Modelo de Machine Learning (Random Forest) para scoring de riesgo y módulo NLP para simulación de entrevistas.", False, False, COLOR_DARK, 12.5, 3.5),
    ("body", "4. Viabilidad Legal y Financiera: Estructuración como S.A.S. (CIIU 6201/6202), plan de inversión ($47.3M) y modelo financiero auditado a 5 años.", False, False, COLOR_DARK, 12.5, 4.5),
    ("heading", "Estado Actual:", True, False, COLOR_DARK, 13, 3),
    ("body", "• Prototipo completamente funcional, listo para fase de despliegue piloto en instituciones co-formadoras aliadas.", False, False, COLOR_DARK, 12.5, 6),
    ("timing", "(Tiempo sugerido: 2 minutos)", False, True, COLOR_MUTED, 11, 0)
]
clear_and_populate(slide7.shapes[1].text_frame, items_s7)

# ==================== SLIDE 8: 7. ¿LOS DE AL LADO? ====================
slide8 = prs.slides[7]
items_s8 = [
    ("heading", "Análisis de la Competencia y Diferenciación", True, False, COLOR_GREEN, 14, 4),
    ("body", "• LMS Tradicionales (Moodle, Q10, Canvas): Fuertes en gestión de notas y contenidos; sin embargo, no poseen módulos predictivos ni preparación de empleabilidad.", False, False, COLOR_DARK, 12, 3),
    ("body", "• Simuladores Extranjeros (InterviewWarmup, Coursera): Enfoque en inglés, para mercado corporativo internacional y precios elevados en dólares (+$5,000 USD).", False, False, COLOR_DARK, 12, 3),
    ("body", "• Consultorías Tradicionales de Bienestar: Procesos manuales, reactivos y de muy alto costo operativo para las instituciones.", False, False, COLOR_DARK, 12, 4),
    ("heading", "Ventajas Competitivas de TalentLab:", True, False, COLOR_DARK, 13, 3),
    ("body", "1. Integralidad 3 en 1: Predicción de deserción + Simulador con IA + Red de Mentorías en una sola plataforma.", False, False, COLOR_DARK, 12, 2.5),
    ("body", "2. Accesibilidad de Precios en COP: Licenciamiento SaaS desde $4.500.000 COP anuales.", False, False, COLOR_DARK, 12, 2.5),
    ("body", "3. Algoritmos Contextualizados: Adaptados a la realidad socioeconómica colombiana.", False, False, COLOR_DARK, 12, 6),
    ("timing", "(Tiempo sugerido: 1 minuto)", False, True, COLOR_MUTED, 11, 0)
]
clear_and_populate(slide8.shapes[1].text_frame, items_s8)

# ==================== SLIDE 9: 8. ¿Y CÓMO NOS CONECTAMOS? ====================
slide9 = prs.slides[8]
items_s9 = [
    ("heading", "Estrategia de Mercado y Canales de Venta B2B", True, False, COLOR_GREEN, 14, 4),
    ("body", "• Venta Directa Consultiva B2B (Canal Principal - 70% de ventas): Demostraciones ejecutivas en vivo del MVP con Directores de Bienestar Institucional y Rectores, sustentando el Retorno de Inversión (ROI) por retención.", False, False, COLOR_DARK, 12, 3.5),
    ("body", "• Inbound Marketing y Autoridad Digital (15% de ventas): Creación y difusión de Whitepapers técnicos, webinars e informes de deserción estudiantil para posicionar a TalentLab como referente EdTech.", False, False, COLOR_DARK, 12, 3.5),
    ("body", "• Eventos y Alianzas Sectoriales (15% de ventas): Participación activa en foros de innovación de la Red de IES, ACIET, ASCUN y ruedas de negocio de la industria de software.", False, False, COLOR_DARK, 12, 3.5),
    ("body", "• Canal Social Freemium: Versión gratuita limitada para instituciones públicas vulnerables, impulsando la tracción de marca, impacto social y validación a gran escala.", False, False, COLOR_DARK, 12, 6),
    ("timing", "(Tiempo sugerido: 1 minuto)", False, True, COLOR_MUTED, 11, 0)
]
clear_and_populate(slide9.shapes[1].text_frame, items_s9)

# ==================== SLIDE 10: 9. ¿LAS CUENTAS CLARAS? ====================
slide10 = prs.slides[9]
shape10 = slide10.shapes[2]
shape10.left = Inches(1.1)
shape10.width = Inches(6.8)
shape10.height = Inches(4.5)

items_s10 = [
    ("heading", "Estructura Financiera y Viabilidad del Proyecto", True, False, COLOR_GREEN, 14, 4),
    ("body", "• Inversión Total Requerida: $47.344.222 COP", True, False, COLOR_DARK, 12.5, 2.5),
    ("body", "   - Crédito Bancario Comercial: $40.644.222 COP (85,85% a 14% E.A., 5 años de plazo; amortización $8.12M anual). (Fondo Emprender como opción alternativa).", False, False, COLOR_DARK, 11.5, 2),
    ("body", "   - Aporte Propio del Emprendedor: $6.700.000 COP (14,15%).", False, False, COLOR_DARK, 11.5, 3),
    ("body", "• Destino de los Recursos: Dotación de cómputo ($9.85M), Muebles de oficina ($4.5M), Gastos legales/SIC ($2.8M) y Capital de Trabajo Operativo ($30.19M).", False, False, COLOR_DARK, 11.5, 3.5),
    ("heading", "Proyección de Ventas y Crecimiento (5 Años):", True, False, COLOR_DARK, 12.5, 2.5),
    ("body", "• Año 1: 12 licencias ($54.0M) | Año 3: 38 licencias ($189.7M) | Año 5: 68 licencias ($358.3M).", False, False, COLOR_DARK, 12, 3.5),
    ("heading", "Indicadores de Evaluación Financiera (TIO 15%):", True, False, COLOR_DARK, 12.5, 2.5),
    ("body", "• VPN: +$125.340.830 COP | TIR: 62,88% | PRI: 2,4 años (Mes 29) | Relación B/C: 1,30.", True, False, COLOR_GREEN, 12.5, 2),
    ("body", "• Margen Bruto: 93,07% | Punto de Equilibrio: 32,2 licencias Plan Lean ($144,9M COP).", False, False, COLOR_DARK, 11.5, 5),
    ("timing", "(Tiempo sugerido: 2 minutos)", False, True, COLOR_MUTED, 11, 0)
]
clear_and_populate(shape10.text_frame, items_s10)

# ==================== SLIDE 11: 10. ¿MIS COMPAÑEROS DE AVENTURA SON? ====================
slide11 = prs.slides[10]
shape11 = slide11.shapes[3]
shape11.left = Inches(0.9)
shape11.width = Inches(6.8)

items_s11 = [
    ("heading", "Equipo Emprendedor e Interdisciplinario", True, False, COLOR_GREEN, 14, 4),
    ("body", "1. Diego Alfonso Tapia Salazar – Director General & Líder de Desarrollo:", True, False, COLOR_DARK, 12.5, 2),
    ("body", "   • Tecnólogo ADSO (SENA). Arquitectura de software, backend en Django REST, modelado de bases de datos relacionales y gestión integral del proyecto.", False, False, COLOR_DARK, 11.5, 3),
    ("body", "2. Área de Inteligencia Artificial & Data Science:", True, False, COLOR_DARK, 12.5, 2),
    ("body", "   • Diseño de pipelines de datos, entrenamiento del modelo de clasificación Random Forest y afinamiento de algoritmos NLP en español.", False, False, COLOR_DARK, 11.5, 3),
    ("body", "3. Área Comercial & Éxito del Cliente (Customer Success):", True, False, COLOR_DARK, 12.5, 2),
    ("body", "   • Relacionamiento estratégico con directivos de IES, demostraciones de producto, onboarding y fidelización institucional.", False, False, COLOR_DARK, 11.5, 3),
    ("body", "4. Respaldo Institucional y Metodológico:", True, False, COLOR_DARK, 12.5, 2),
    ("body", "   • Asesoría técnica permanente del SENA (Centro de Diseño y Metrología) e instructores del programa ADSO.", False, False, COLOR_DARK, 11.5, 5),
    ("timing", "(Tiempo sugerido: 1 minuto 30 segundos)", False, True, COLOR_MUTED, 11, 0)
]
clear_and_populate(shape11.text_frame, items_s11)

# ==================== SLIDE 12: CIERRE ====================
slide12 = prs.slides[11]
close_box = None
for s in slide12.shapes:
    if s.name == "ClosingBox":
        close_box = s
        break
if not close_box:
    close_box = slide12.shapes.add_textbox(Inches(2.5), Inches(2.2), Inches(8.3), Inches(3.2))
    close_box.name = "ClosingBox"

tf12 = close_box.text_frame
tf12.clear()

p12_1 = tf12.paragraphs[0]
p12_1.alignment = PP_ALIGN.CENTER
r12_1 = p12_1.add_run()
r12_1.text = "TALENTLAB S.A.S."
r12_1.font.name = FONT_NAME
r12_1.font.size = Pt(28)
r12_1.font.bold = True
r12_1.font.color.rgb = COLOR_GREEN

p12_2 = tf12.add_paragraph()
p12_2.alignment = PP_ALIGN.CENTER
p12_2.space_before = Pt(6)
r12_2 = p12_2.add_run()
r12_2.text = "\"Detecta a tiempo. Prepara con IA. Conecta hacia el futuro laboral.\""
r12_2.font.name = FONT_NAME
r12_2.font.size = Pt(16)
r12_2.font.italic = True
r12_2.font.color.rgb = COLOR_DARK

p12_3 = tf12.add_paragraph()
p12_3.alignment = PP_ALIGN.CENTER
p12_3.space_before = Pt(14)
r12_3 = p12_3.add_run()
r12_3.text = "¡Muchas Gracias por su Atención!"
r12_3.font.name = FONT_NAME
r12_3.font.size = Pt(22)
r12_3.font.bold = True
r12_3.font.color.rgb = COLOR_GREEN

p12_4 = tf12.add_paragraph()
p12_4.alignment = PP_ALIGN.CENTER
p12_4.space_before = Pt(8)
r12_4 = p12_4.add_run()
r12_4.text = "Espacio para Preguntas y Retroalimentación del Jurado Evaluador\nDiego Alfonso Tapia Salazar | Tecnólogo ADSO Ficha 2996897 | SENA"
r12_4.font.name = FONT_NAME
r12_4.font.size = Pt(13)
r12_4.font.bold = False
r12_4.font.color.rgb = COLOR_DARK

prs.save("PITCH PRESENTACIÓN FINAL.pptx")
print("Saved cleanly without unicode issues!")
