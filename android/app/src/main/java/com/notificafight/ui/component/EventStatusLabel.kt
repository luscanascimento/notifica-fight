package com.notificafight.ui.component

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import com.notificafight.R
import com.notificafight.domain.model.EventStatus
import com.notificafight.ui.theme.FightSpacing

@Composable
fun EventStatusLabel(status: EventStatus) {
    val text = when (status) {
        EventStatus.SCHEDULED -> stringResource(R.string.event_status_scheduled)
        EventStatus.POSTPONED -> stringResource(R.string.event_status_postponed)
        EventStatus.CANCELED -> stringResource(R.string.event_status_canceled)
        EventStatus.FINISHED -> stringResource(R.string.event_status_finished)
    }
    val containerColor = when (status) {
        EventStatus.SCHEDULED -> MaterialTheme.colorScheme.primaryContainer
        EventStatus.POSTPONED -> MaterialTheme.colorScheme.secondaryContainer
        EventStatus.CANCELED -> MaterialTheme.colorScheme.errorContainer
        EventStatus.FINISHED -> MaterialTheme.colorScheme.surfaceVariant
    }
    val contentColor = when (status) {
        EventStatus.SCHEDULED -> MaterialTheme.colorScheme.onPrimaryContainer
        EventStatus.POSTPONED -> MaterialTheme.colorScheme.onSecondaryContainer
        EventStatus.CANCELED -> MaterialTheme.colorScheme.onErrorContainer
        EventStatus.FINISHED -> MaterialTheme.colorScheme.onSurfaceVariant
    }
    Surface(
        color = containerColor,
        contentColor = contentColor,
        shape = MaterialTheme.shapes.extraSmall,
    ) {
        Text(
            text = text.uppercase(),
            modifier = Modifier.padding(
                horizontal = FightSpacing.small,
                vertical = FightSpacing.xSmall,
            ),
            style = MaterialTheme.typography.labelSmall,
        )
    }
}
