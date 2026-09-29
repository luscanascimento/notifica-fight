package com.notificafight.feature.upcoming

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
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
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.notificafight.R
import com.notificafight.domain.model.CombatEvent
import com.notificafight.ui.component.EventStatusLabel
import com.notificafight.ui.theme.FightElevation
import com.notificafight.ui.theme.FightMotion
import com.notificafight.ui.theme.FightSpacing
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle

@Composable
fun UpcomingEventsRoute(
    viewModel: UpcomingEventsViewModel,
    onEventClick: (String) -> Unit,
    onOrganizationsClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    UpcomingEventsScreen(
        state = state,
        onRetry = viewModel::retry,
        onRefresh = viewModel::retry,
        onEventClick = onEventClick,
        onOrganizationsClick = onOrganizationsClick,
        modifier = modifier,
    )
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
fun UpcomingEventsScreen(
    state: UpcomingEventsUiState,
    onRetry: () -> Unit,
    onRefresh: () -> Unit = onRetry,
    onEventClick: (String) -> Unit,
    onOrganizationsClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = stringResource(R.string.upcoming_events_title),
                        style = MaterialTheme.typography.headlineSmall,
                    )
                },
                actions = {
                    TextButton(onClick = onRefresh) {
                        Text(stringResource(R.string.refresh_action))
                    }
                    TextButton(onClick = onOrganizationsClick) {
                        Text(stringResource(R.string.organizations_action))
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                ),
            )
        },
    ) { contentPadding ->
        AnimatedContent(
            targetState = state,
            transitionSpec = {
                fadeIn(tween(FightMotion.standardMillis)) togetherWith
                    fadeOut(tween(FightMotion.standardMillis))
            },
            contentKey = { it::class },
            label = "upcoming-events-state",
        ) { currentState ->
            when (currentState) {
                UpcomingEventsUiState.Loading -> LoadingState(
                    modifier = Modifier.padding(contentPadding),
                )
                UpcomingEventsUiState.Empty -> EmptyState(
                    modifier = Modifier.padding(contentPadding),
                )
                UpcomingEventsUiState.Error -> ErrorState(
                    onRetry = onRetry,
                    modifier = Modifier.padding(contentPadding),
                )
                is UpcomingEventsUiState.Success -> EventsList(
                    state = currentState,
                    onEventClick = onEventClick,
                    contentPadding = contentPadding,
                )
            }
        }
    }
}

@Composable
private fun LoadingState(modifier: Modifier = Modifier) {
    Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator()
        Text(
            text = stringResource(R.string.loading_events),
            modifier = Modifier.padding(top = FightSpacing.xxxLarge),
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun EmptyState(modifier: Modifier = Modifier) {
    MessageState(
        title = stringResource(R.string.empty_events_title),
        body = stringResource(R.string.empty_events_body),
        modifier = modifier,
    )
}

@Composable
private fun ErrorState(
    onRetry: () -> Unit,
    modifier: Modifier = Modifier,
) {
    MessageState(
        title = stringResource(R.string.error_events_title),
        body = stringResource(R.string.error_events_body),
        action = {
            Button(onClick = onRetry) {
                Text(stringResource(R.string.retry))
            }
        },
        modifier = modifier,
    )
}

@Composable
private fun MessageState(
    title: String,
    body: String,
    modifier: Modifier = Modifier,
    action: (@Composable () -> Unit)? = null,
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(FightSpacing.large),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(text = title, style = MaterialTheme.typography.headlineSmall)
        Spacer(Modifier.height(FightSpacing.small))
        Text(
            text = body,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            style = MaterialTheme.typography.bodyLarge,
        )
        if (action != null) {
            Spacer(Modifier.height(FightSpacing.large))
            action()
        }
    }
}

@Composable
private fun EventsList(
    state: UpcomingEventsUiState.Success,
    onEventClick: (String) -> Unit,
    contentPadding: PaddingValues,
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(
            start = FightSpacing.medium,
            top = contentPadding.calculateTopPadding() + FightSpacing.small,
            end = FightSpacing.medium,
            bottom = contentPadding.calculateBottomPadding() + FightSpacing.large,
        ),
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
                        modifier = Modifier.padding(FightSpacing.medium),
                        color = MaterialTheme.colorScheme.onSecondaryContainer,
                        style = MaterialTheme.typography.labelLarge,
                    )
                }
            }
        }
        items(items = state.events, key = CombatEvent::id) { event ->
            EventCard(event = event, onClick = { onEventClick(event.id) })
        }
    }
}

@Composable
private fun EventCard(
    event: CombatEvent,
    onClick: () -> Unit,
) {
    val formatter = remember {
        DateTimeFormatter.ofLocalizedDateTime(FormatStyle.MEDIUM, FormatStyle.SHORT)
            .withZone(ZoneId.systemDefault())
    }
    val location = listOfNotNull(event.city, event.countryCode).joinToString(", ")

    Card(
        onClick = onClick,
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceContainer,
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = FightElevation.card),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(FightSpacing.large),
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
            Spacer(Modifier.height(FightSpacing.medium))
            Text(text = event.name, style = MaterialTheme.typography.titleLarge)
            Spacer(Modifier.height(FightSpacing.small))
            Text(
                text = formatter.format(event.startTime),
                color = MaterialTheme.colorScheme.onSurface,
                style = MaterialTheme.typography.titleMedium,
            )
            if (event.venueName != null || location.isNotEmpty()) {
                Spacer(Modifier.height(FightSpacing.xSmall))
                Text(
                    text = listOfNotNull(event.venueName, location.takeIf(String::isNotEmpty))
                        .joinToString(" · "),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
        }
    }
}
