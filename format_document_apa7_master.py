import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
import re

def remove_run_decorations(r):
    """Removes run-level highlights and shading (web paste artifacts)."""
    rPr = r._r.get_or_add_rPr()
    for hl in rPr.xpath('./w:highlight'):
        rPr.remove(hl)
    for shd in rPr.xpath('./w:shd'):
        rPr.remove(shd)

def apply_apa7(input_path, output_path):
    print(f"Loading document: {input_path}")
    doc = docx.Document(input_path)
    black_color = RGBColor(0, 0, 0)

    # 1. Page Margins (2.54 cm = 1.0 inch on all 4 sides across all sections)
    print("1. Standardizing margins to 1.0 inch (2.54 cm) on all sections...")
    for s_idx, section in enumerate(doc.sections):
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # 2. Styles Configuration
    print("2. Configuring standard APA 7 styles in document...")
    styles_dict = {
        'Normal': (Pt(11), False, False),
        'Plain Text': (Pt(11), False, False),
        'List Paragraph': (Pt(11), False, False),
        'Heading 1': (Pt(12), True, False),
        'Heading 2': (Pt(11), True, False),
        'Heading 3': (Pt(11), True, True),
    }

    for s_name, (sz, bold, italic) in styles_dict.items():
        try:
            s = doc.styles[s_name]
            s.font.name = 'Arial'
            s.font.size = sz
            s.font.bold = bold
            s.font.italic = italic
            s.font.color.rgb = black_color
        except KeyError:
            pass

    # 3. Process Paragraphs
    print("3. Processing and standardizing all paragraphs...")
    major_center_titles = {
        'RESUMEN EJECUTIVO', 'INTRODUCCIÓN', 'GLOSARIO', 'CONCLUSIONES', 
        'RECOMENDACIONES', 'REFERENCIAS BIBLIOGRÁFICAS', 'BIBLIOGRAFÍA', 
        'ANEXOS', 'TABLA DE CONTENIDO', 'LISTA DE TABLAS', 'LISTA DE FIGURAS', 'LISTA DE ANEXOS'
    }

    for idx, p in enumerate(doc.paragraphs):
        raw_text = p.text.strip()
        if not raw_text:
            # Set empty runs to Arial
            for r in p.runs:
                r.font.name = 'Arial'
            continue

        # Corrections in text
        if 'REGIONAL DISTRITO CAPTIAL' in raw_text:
            for r in p.runs:
                if 'CAPTIAL' in r.text:
                    r.text = r.text.replace('CAPTIAL', 'CAPITAL')
        if 'NOMBRE DEL PROGRAMA DE FORMACIÓN' in raw_text:
            for r in p.runs:
                if 'NOMBRE DEL PROGRAMA DE FORMACIÓN' in r.text:
                    r.text = r.text.replace('NOMBRE DEL PROGRAMA DE FORMACIÓN', 'TECNOLOGÍA EN ANÁLISIS Y DESARROLLO DE SOFTWARE')
        if '**' in raw_text:
            for r in p.runs:
                if '**' in r.text:
                    r.text = r.text.replace('**', '')

        # Check special roles
        is_cover = (idx < 80 and p.alignment == WD_ALIGN_PARAGRAPH.CENTER)
        is_toc_item = (220 <= idx <= 305 and '\t' in raw_text)
        is_source_or_note = raw_text.lower().startswith(('fuente:', 'nota:', 'fuente de elaboración:', 'fuente elaboración:'))
        is_caption = (raw_text.startswith(('Tabla ', 'Figura ', 'Ilustración ')) and len(raw_text) < 140 and not is_toc_item)

        # Promote RESUMEN EJECUTIVO to Heading 1 if not already
        if raw_text == 'RESUMEN EJECUTIVO':
            try:
                p.style = doc.styles['Heading 1']
            except KeyError:
                pass

        # If Plain Text style, change to Normal
        if p.style and p.style.name == 'Plain Text':
            try:
                p.style = doc.styles['Normal']
            except KeyError:
                pass

        # Formatting based on role/style
        style_name = p.style.name if p.style else 'Normal'

        if is_cover:
            p.paragraph_format.line_spacing = 1.15
            for r in p.runs:
                r.font.name = 'Arial'
                r.font.color.rgb = black_color
                remove_run_decorations(r)
                if not r.font.size or r.font.size.pt < 11:
                    r.font.size = Pt(11)

        elif is_toc_item:
            p.paragraph_format.line_spacing = 1.15
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(2)
            for r in p.runs:
                r.font.name = 'Arial'
                r.font.size = Pt(10.5)
                r.font.color.rgb = black_color
                remove_run_decorations(r)

        elif style_name == 'Heading 1':
            p.paragraph_format.line_spacing = 1.5
            p.paragraph_format.space_before = Pt(14)
            p.paragraph_format.space_after = Pt(6)
            if raw_text.upper() in major_center_titles:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for r in p.runs:
                r.font.name = 'Arial'
                r.font.size = Pt(12)
                r.font.bold = True
                r.font.color.rgb = black_color
                remove_run_decorations(r)

        elif style_name == 'Heading 2':
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.line_spacing = 1.5
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after = Pt(4)
            for r in p.runs:
                r.font.name = 'Arial'
                r.font.size = Pt(11)
                r.font.bold = True
                r.font.color.rgb = black_color
                remove_run_decorations(r)

        elif style_name == 'Heading 3':
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.line_spacing = 1.5
            p.paragraph_format.space_before = Pt(10)
            p.paragraph_format.space_after = Pt(3)
            for r in p.runs:
                r.font.name = 'Arial'
                r.font.size = Pt(11)
                r.font.bold = True
                r.font.italic = True
                r.font.color.rgb = black_color
                remove_run_decorations(r)

        elif is_caption:
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.line_spacing = 1.15
            p.paragraph_format.space_before = Pt(8)
            p.paragraph_format.space_after = Pt(2)
            for r in p.runs:
                r.font.name = 'Arial'
                r.font.size = Pt(10)
                r.font.color.rgb = black_color
                remove_run_decorations(r)

        elif is_source_or_note:
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.line_spacing = 1.0
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(8)
            for r in p.runs:
                r.font.name = 'Arial'
                r.font.size = Pt(9.5)
                r.font.italic = True
                r.font.color.rgb = black_color
                remove_run_decorations(r)

        else:
            # Regular body paragraph
            if p.alignment != WD_ALIGN_PARAGRAPH.CENTER and p.alignment != WD_ALIGN_PARAGRAPH.RIGHT:
                p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

            p.paragraph_format.line_spacing = 1.5
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(4)

            for r in p.runs:
                r.font.name = 'Arial'
                r.font.size = Pt(11)
                r.font.color.rgb = black_color
                remove_run_decorations(r)

    # 4. Process Tables
    print(f"4. Processing {len(doc.tables)} tables...")
    for t_idx, table in enumerate(doc.tables):
        for r_idx, row in enumerate(table.rows):
            is_header = (r_idx == 0)
            for cell in row.cells:
                for p in cell.paragraphs:
                    p.paragraph_format.line_spacing = 1.15
                    p.paragraph_format.space_before = Pt(0)
                    p.paragraph_format.space_after = Pt(2)
                    for r in p.runs:
                        r.font.name = 'Arial'
                        r.font.color.rgb = black_color
                        remove_run_decorations(r)
                        if is_header:
                            r.font.size = Pt(10)
                            r.font.bold = True
                        else:
                            r.font.size = Pt(9.5)

    print(f"Saving finalized document: {output_path}")
    doc.save(output_path)
    print("Done! Document successfully aligned to APA 7th Edition.")

if __name__ == '__main__':
    apply_apa7(
        'Plantilla del Proyecto Productivo revision_FINAL.docx',
        'Plantilla del Proyecto Productivo revision_FINAL.docx'
    )
