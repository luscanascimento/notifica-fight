package com.notificafight.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.material3.Typography
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

object FightColors {
    val Ink = Color(0xFF0B0D10)
    val Graphite = Color(0xFF15181D)
    val Steel = Color(0xFF22262D)
    val White = Color(0xFFF5F7FA)
    val Silver = Color(0xFFB5BDC9)
    val Signal = Color(0xFFFFB703)
    val SignalDark = Color(0xFF5C4100)
    val Alert = Color(0xFFFF6B6B)
    val AlertDark = Color(0xFF5C191D)
}

object FightSpacing {
    val xSmall = 4.dp
    val small = 8.dp
    val medium = 12.dp
    val large = 20.dp
    val xxxLarge = 72.dp
}

object FightElevation {
    val card = 2.dp
}

object FightMotion {
    const val standardMillis = 180
}

private val FightShapes = androidx.compose.material3.Shapes(
    extraSmall = RoundedCornerShape(6.dp),
    small = RoundedCornerShape(10.dp),
    medium = RoundedCornerShape(14.dp),
    large = RoundedCornerShape(20.dp),
)

private val FightTypography = Typography(
    headlineSmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Black,
        fontSize = 24.sp,
        letterSpacing = (-0.4).sp,
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 20.sp,
    ),
    titleMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 16.sp,
    ),
)

private val DarkColors = darkColorScheme(
    primary = FightColors.Signal,
    onPrimary = FightColors.Ink,
    primaryContainer = FightColors.SignalDark,
    background = FightColors.Ink,
    onBackground = FightColors.White,
    surface = FightColors.Graphite,
    surfaceContainer = FightColors.Steel,
    onSurface = FightColors.White,
    onSurfaceVariant = FightColors.Silver,
    error = FightColors.Alert,
    errorContainer = FightColors.AlertDark,
)

private val LightColors = lightColorScheme(
    primary = Color(0xFF765900),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFFFDF8A),
    background = Color(0xFFF8F9FC),
    onBackground = FightColors.Ink,
    surface = Color.White,
    onSurface = FightColors.Ink,
    error = Color(0xFFBA1A1A),
)

@Composable
fun FightTheme(
    darkTheme: Boolean = true,
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        typography = FightTypography,
        shapes = FightShapes,
        content = content,
    )
}
