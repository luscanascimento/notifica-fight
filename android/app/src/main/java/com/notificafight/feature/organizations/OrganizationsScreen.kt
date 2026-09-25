package com.notificafight.feature.organizations

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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.notificafight.R
import com.notificafight.domain.model.Organization
import com.notificafight.ui.theme.FightElevation
import com.notificafight.ui.theme.FightSpacing

@Composable
fun OrganizationsRoute(
    viewModel: OrganizationsViewModel,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    OrganizationsScreen(
        state = state,
        onBack = onBack,
        onRetry = viewModel::retry,
        modifier = modifier,
    )
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
fun OrganizationsScreen(
    state: OrganizationsUiState,
    onBack: () -> Unit,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = stringResource(R.string.organizations_title),
                        style = MaterialTheme.typography.headlineSmall,
                    )
                },
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
            OrganizationsUiState.Loading -> LoadingState(
                modifier = Modifier.padding(contentPadding),
            )
            OrganizationsUiState.Empty -> EmptyState(
                modifier = Modifier.padding(contentPadding),
            )
            OrganizationsUiState.Error -> ErrorState(
                onRetry = onRetry,
                modifier = Modifier.padding(contentPadding),
            )
            is OrganizationsUiState.Success -> OrganizationsList(
                state = state,
                contentPadding = contentPadding,
            )
        }
    }
}

@Composable
private fun LoadingState(modifier: Modifier = Modifier) {
    Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator()
        Text(
            text = stringResource(R.string.loading_organizations),
            modifier = Modifier.padding(top = FightSpacing.xxxLarge),
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun EmptyState(modifier: Modifier = Modifier) {
    MessageState(
        title = stringResource(R.string.empty_organizations_title),
        body = stringResource(R.string.empty_organizations_body),
        modifier = modifier,
    )
}

@Composable
private fun ErrorState(
    onRetry: () -> Unit,
    modifier: Modifier = Modifier,
) {
    MessageState(
        title = stringResource(R.string.error_organizations_title),
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
private fun OrganizationsList(
    state: OrganizationsUiState.Success,
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
        items(items = state.organizations, key = Organization::id) { organization ->
            OrganizationCard(organization)
        }
    }
}

@Composable
private fun OrganizationCard(organization: Organization) {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceContainer,
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = FightElevation.card),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(FightSpacing.large),
            horizontalArrangement = Arrangement.spacedBy(FightSpacing.large),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Surface(
                color = MaterialTheme.colorScheme.primaryContainer,
                contentColor = MaterialTheme.colorScheme.onPrimaryContainer,
                shape = MaterialTheme.shapes.small,
            ) {
                Text(
                    text = organization.code.uppercase(),
                    modifier = Modifier.padding(FightSpacing.medium),
                    style = MaterialTheme.typography.labelLarge,
                )
            }
            Column {
                Text(
                    text = organization.name,
                    style = MaterialTheme.typography.titleLarge,
                )
                Text(
                    text = organization.code.uppercase(),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
        }
    }
}
