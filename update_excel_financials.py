import os
import subprocess

# We will write a powershell script and execute it
ps_script_path = os.path.abspath("run_excel_update.ps1")

ps_content = """
$ErrorActionPreference = 'Stop'
Write-Host "Iniciando automatizacion de Excel para actualizar el Estudio Financiero..."

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

$filePath = "c:\\Users\\ingdi\\OneDrive\\Desktop\\DUKITO DOC\\SENA_PR\\EJEMPLO GUIA PROYECTO excel(1).xlsm"
Write-Host "Abriendo archivo: $filePath"
$wb = $excel.Workbooks.Open($filePath)

try {
    # 1. Actualizar Hoja Bases
    $wsBases = $wb.Sheets.Item("Bases")
    Write-Host "Actualizando hoja Bases..."
    # D30: Gracia (0 anos)
    $wsBases.Range("D30").Value2 = 0
    # D31: Plazo (5 anos)
    $wsBases.Range("D31").Value2 = 5
    # D32: Tasa en pesos (0.14 = 14%)
    $wsBases.Range("D32").Value2 = 0.14
    # F25 o D25: Tasa de descuento (15%)
    $wsBases.Range("F25").Value2 = 0.15

    # 2. Actualizar Hoja Estructura de Capital
    $wsEst = $wb.Sheets.Item("Estructura de Capital")
    Write-Host "Actualizando hoja Estructura de Capital..."
    # E81: Capital Socios ($6,700,000)
    $wsEst.Range("E81").Value2 = 6700000
    # E83: Obligaciones Fondo Emprender ($0)
    $wsEst.Range("E83").Value2 = 0
    # E84: Obligaciones Financieras (Credito Bancario = $71,968,832)
    $wsEst.Range("E84").Value2 = 71968832

    # 3. Actualizar Hoja Plan Inversion y Financiacion
    # Buscar la hoja que contenga "Plan Invers"
    $wsPlan = $null
    for ($i = 1; $i -le $wb.Sheets.Count; $i++) {
        if ($wb.Sheets.Item($i).Name -like "*Plan Invers*") {
            $wsPlan = $wb.Sheets.Item($i)
            break
        }
    }

    if ($wsPlan -ne $null) {
        Write-Host "Actualizando hoja $($wsPlan.Name)..."
        # Trasladar rubros de Columna F (Fondo Emprender) a Columna E (Deuda / Credito)
        # Inversiones Fijas
        $wsPlan.Range("E12").Value2 = 4500000
        $wsPlan.Range("F12").Value2 = 0
        $wsPlan.Range("E14").Value2 = 9850000
        $wsPlan.Range("F14").Value2 = 0

        # Capital de Trabajo
        $wsPlan.Range("E21").Value2 = 86139442
        $wsPlan.Range("F21").Value2 = 0
        $wsPlan.Range("G21").Value2 = 6700000

        # Inversiones Diferidas
        $wsPlan.Range("E26").Value2 = 50000
        $wsPlan.Range("F26").Value2 = 0
        $wsPlan.Range("E27").Value2 = 279000
        $wsPlan.Range("F27").Value2 = 0
        $wsPlan.Range("E28").Value2 = 75000
        $wsPlan.Range("F28").Value2 = 0
        $wsPlan.Range("E36").Value2 = 800000
        $wsPlan.Range("F36").Value2 = 0
        $wsPlan.Range("E38").Value2 = 480000
        $wsPlan.Range("F38").Value2 = 0
        $wsPlan.Range("E40").Value2 = 1120000
        $wsPlan.Range("F40").Value2 = 0
    }

    # 4. Recalcular todo el libro
    Write-Host "Recalculando formulas del libro..."
    $excel.CalculateFull()

    # 5. Guardar cambios
    Write-Host "Guardando archivo..."
    $wb.Save()
    Write-Host "Archivo guardado exitosamente."

} finally {
    $wb.Close($false)
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}
"""

with open(ps_script_path, "w", encoding="utf-8") as f:
    f.write(ps_content)

print(f"Script powershell escrito en: {ps_script_path}")
res = subprocess.run(["powershell", "-ExecutionPolicy", "Bypass", "-File", ps_script_path], capture_output=True, text=True)
print("STDOUT:")
print(res.stdout)
print("STDERR:")
print(res.stderr)
