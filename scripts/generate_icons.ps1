Add-Type -AssemblyName System.Drawing

function Create-AppIcon {
    $bmp = New-Object System.Drawing.Bitmap(512, 512)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    # Helper function to create rounded rectangle path
    function New-RoundRectPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $d = $r * 2
        $path.AddArc($x, $y, $d, $d, 180, 90)
        $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
        $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
        $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
        $path.CloseFigure()
        return $path
    }

    # 1. Fondo Blanco Minimalista con Bordes Redondeados Squircle
    $bgPath = New-RoundRectPath 0 0 512 512 112
    $whiteBrush = [System.Drawing.Brushes]::White
    $g.FillPath($whiteBrush, $bgPath)

    # Borde sutil gris claro para pestañas claras
    $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(235, 235, 240), 2)
    $borderPath = New-RoundRectPath 1 1 510 510 111
    $g.DrawPath($borderPen, $borderPath)

    # 2. Barra Superior de Claqueta (Negro Profundo #09090B)
    $blackBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(9, 9, 11))
    $topBarPath = New-RoundRectPath 96 104 320 62 16
    $g.FillPath($blackBrush, $topBarPath)

    # Franjas Blancas Anguladas en la Barra Superior
    $oldClip = $g.Clip
    $g.SetClip($topBarPath)
    $stripePen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 26)
    for ($x = 60; $x -le 460; $x += 68) {
        $g.DrawLine($stripePen, [float]$x, [float]180, [float]($x + 40), [float]90)
    }
    $g.Clip = $oldClip

    # 3. Pizarra Principal de Video (Negro Profundo #09090B)
    $bodyPath = New-RoundRectPath 96 180 320 228 24
    $g.FillPath($blackBrush, $bodyPath)

    # 4. Símbolo Play Centrado (Blanco con Vértices Redondeados)
    $playPen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 10)
    $playPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $pts = @(
        (New-Object System.Drawing.PointF(236, 252)),
        (New-Object System.Drawing.PointF(236, 322)),
        (New-Object System.Drawing.PointF(296, 287))
    )
    $g.FillPolygon($whiteBrush, $pts)
    $g.DrawPolygon($playPen, $pts)

    # 5. Cabezal de Edición / Línea de Tiempo
    $scrubPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(90, 255, 255, 255), 6)
    $scrubPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $scrubPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($scrubPen, [float]180, [float]360, [float]332, [float]360)
    $g.FillEllipse($whiteBrush, 250, 354, 12, 12)

    # Guardar apple-touch-icon.png (512x512)
    $bmp.Save("public/apple-touch-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)

    # Guardar favicon.png (192x192) y favicon-32x32.png
    $icon192 = New-Object System.Drawing.Bitmap($bmp, 192, 192)
    $icon192.Save("public/favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)

    $icon32 = New-Object System.Drawing.Bitmap($bmp, 32, 32)
    $icon32.Save("public/favicon-32x32.png", [System.Drawing.Imaging.ImageFormat]::Png)

    $g.Dispose()
    $bmp.Dispose()
    $icon192.Dispose()
    $icon32.Dispose()
    Write-Host "App icons generated successfully!"
}

Create-AppIcon
