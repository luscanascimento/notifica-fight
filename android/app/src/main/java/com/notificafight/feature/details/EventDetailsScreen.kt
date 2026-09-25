package com.notificafight.feature.details

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.notificafight.R
import com.notificafight.domain.model.CombatEvent
import com.notificafight.domain.model.CombatFight
import com.notificafight.ui.component.EventStatusLabel
import com.notificafight.ui.theme.FightElevation
import com.notificafight.ui.theme.FightSpacing
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle

@Composable
fun EventDetailsRoute(
    eventId: String,
    viewModel: EventDetailsViewModel,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    LaunchedEffect(eventId) {
        viewModel.load(eventId)
    }
    EventDetailsScreen(
        state = state,
        onBack = onBack,
        onRetry = viewModel::retry,
        modifier = modifier,
    )
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
fun EventDetailsScreen(
    state: EventDetailsUiState,
    onBack: () -> Unit,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.event_details_title)) },
                navigationIcon = {
                    TextButton(onClick = onBack) {
                        Text(stringResource(R.string.back))
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                ),
            )
        },
    ) { contentPadding ->
        when (state) {
            EventDetailsUiState.Loading -> DetailsLoadingState(
                modifier = Modifier.padding(contentPadding),
            )
            EventDetailsUiState.Error -> DetailsErrorState(
                onRetry = onRetry,
                modifier = Modifier.padding(contentPadding),
            )
            is EventDetailsUiState.Success -> EventDetailsContent(
                state = state,
                modifier = Modifier.padding(contentPadding),
            )
        }
    }
}

@Composable
private fun DetailsLoadingState(modifier: Modifier = Modifier) {
    Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator()
        Text(
            text = stringResource(R.string.loading_event_details),
            modifier = Modifier.padding(top = FightSpacing.xxxLarge),
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun DetailsErrorState(
    onRetry: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(FightSpacing.large),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = stringResource(R.string.error_event_details_title),
            style = MaterialTheme.typography.headlineSmall,
        )
        Spacer(Modifier.height(FightSpacing.small))
        Text(
            text = stringResource(R.string.error_events_body),
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            style = MaterialTheme.typography.bodyLarge,
        )
        Spacer(Modifier.height(FightSpacing.large))
        Button(onClick = onRetry) {
            Text(stringResource(R.string.retry))
        }
    }
}

@Composable
private fun EventDetailsContent(
    state: EventDetailsUiState.Success,
    modifier: Modifier = Modifier,
) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(FightSpacing.large),
        verticalArrangement = Arrangement.spacedBy(FightSpacing.medium),
    ) {
        if (state.showingCachedData) {
            item(key = "offline-banner") {
                Surface(
                    color = MaterialTheme.colorScheme.secondaryContainer,
                    shape = MaterialTheme.shapes.small,
                ) {
                    Text(
                        text = stringResource(R.string.offline_data),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(FightSpacing.medium),
                        color = MaterialTheme.colorScheme.onSecondaryContainer,
                        style = MaterialTheme.typography.labelLarge,
                    )
                }
            }
        }
        item(key = "event-header") { EventHeader(state.event) }
        item(key = "event-divider") { HorizontalDivider() }
        item(key = "event-details") { DetailRows(state.event) }
        item(key = "card-title") {
            Text(
                text = stringResource(R.string.event_card_title),
                modifier = Modifier.padding(top = FightSpacing.small),
                style = MaterialTheme.typography.headlineSmall,
            )
        }
        if (state.fights.isEmpty()) {
            item(key = "empty-card") {
                Text(
                    text = stringResource(R.string.empty_event_card),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.bodyLarge,
                )
            }
        } else {
            items(items = state.fights, key = CombatFight::id) { fight ->
                FightCard(fight)
            }
        }
    }
}

@Composable
private fun EventHeader(event: CombatEvent) {
    Column(
        verticalArrangement = Arrangement.spacedBy(FightSpacing.medium),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = event.organization.name.uppercase(),
                color = MaterialTheme.colorScheme.primary,
                style = MaterialTheme.typography.labelLarge,
            )
            EventStatusLabel(event.status)
        }
        Text(text = event.name, style = MaterialTheme.typography.headlineSmall)
    }
}

@Composable
private fun FightCard(fight: CombatFight) {
    val positionLabel = if (fight.cardPosition == 1) {
        stringResource(R.string.card_main_event)
    } else {
        stringResource(R.string.card_fight_position, fight.cardPosition)
    }
    Card(
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceContainer,
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = FightElevation.card),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(FightSpacing.large),
            verticalArrangement = Arrangement.spacedBy(FightSpacing.small),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = positionLabel.uppercase(),
                    color = MaterialTheme.colorScheme.primary,
                    style = MaterialTheme.typography.labelMedium,
                )
                if (fight.isTitleFight) {
                    Surface(
                        color = MaterialTheme.colorScheme.primaryContainer,
                        contentColor = MaterialTheme.colorScheme.onPrimaryContainer,
                        shape = MaterialTheme.shapes.extraSmall,
                    ) {
                        Text(
                            text = stringResource(R.string.title_fight).uppercase(),
                            modifier = Modifier.padding(
                                horizontal = FightSpacing.small,
                                vertical = FightSpacing.xSmall,
                            ),
                            style = MaterialTheme.typography.labelSmall,
                        )
                    }
                }
            }
            Text(
                text = fight.redCornerName,
                style = MaterialTheme.typography.titleMedium,
            )
            Text(
                text = stringResource(R.string.versus),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.labelMedium,
            )
            Text(
                text = fight.blueCornerName,
                style = MaterialTheme.typography.titleMedium,
            )
            fight.weightClass?.let { weightClass ->
                Text(
                    text = weightClass,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
        }
    }
}

@Composable
private fun DetailRows(event: CombatEvent) {
    val formatter = remember {
        DateTimeFormatter.ofLocalizedDateTime(FormatStyle.FULL, FormatStyle.SHORT)
            .withZone(ZoneId.systemDefault())
    }
    val location = listOfNotNull(event.city, event.countryCode).joinToString(", ")
    val venue = listOfNotNull(event.venueName, location.takeIf(String::isNotEmpty))
        .joinToString(" · ")

    DetailRow(
        label = stringResource(R.string.event_date_and_time),
        value = formatter.format(event.startTime),
    )
    DetailRow(
        label = stringResource(R.string.event_location),
        value = if (venue.isEmpty()) {
            stringResource(R.string.event_location_unavailable)
        } else {
            venue
        },
    )
    DetailRow(
        label = stringResource(R.string.event_timezone),
        value = event.eventTimezone,
    )
}

@Composable
private fun DetailRow(label: String, value: String) {
    Column(verticalArrangement = Arrangement.spacedBy(FightSpacing.xSmall)) {
        Text(
            text = label.uppercase(),
            color = MaterialTheme.colorScheme.primary,
            style = MaterialTheme.typography.labelMedium,
        )
        Text(
            text = value,
            color = MaterialTheme.colorScheme.onSurface,
            style = MaterialTheme.typography.titleMedium,
        )
    }
}
