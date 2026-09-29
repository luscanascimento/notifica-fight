package com.notificafight.feature.settings

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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
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
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.notificafight.R
import com.notificafight.ui.theme.FightElevation
import com.notificafight.ui.theme.FightSpacing

@Composable
fun SettingsRoute(
    viewModel: SettingsViewModel,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    SettingsScreen(
        state = state,
        onBack = onBack,
        onCheckUpdates = viewModel::checkForUpdates,
        modifier = modifier,
    )
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
fun SettingsScreen(
    state: SettingsUiState,
    onBack: () -> Unit,
    onCheckUpdates: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = stringResource(R.string.settings_title),
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
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(
                start = FightSpacing.medium,
                top = contentPadding.calculateTopPadding() + FightSpacing.small,
                end = FightSpacing.medium,
                bottom = contentPadding.calculateBottomPadding() + FightSpacing.large,
            ),
            verticalArrangement = Arrangement.spacedBy(FightSpacing.large),
        ) {
            item(key = "app_info_card") {
                AppInfoCard(state = state)
            }
            item(key = "update_card") {
                AppUpdateCard(
                    state = state,
                    onCheckUpdates = onCheckUpdates,
                )
            }
        }
    }
}

@Composable
private fun AppInfoCard(state: SettingsUiState) {
    val currentVersion = when (state) {
        is SettingsUiState.Idle -> state.currentVersion
        is SettingsUiState.Checking -> state.currentVersion
        is SettingsUiState.UpToDate -> state.currentVersion
        is SettingsUiState.UpdateAvailable -> state.currentVersion
        is SettingsUiState.Error -> state.currentVersion
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
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
            Text(
                text = stringResource(R.string.app_name),
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.primary,
            )
            Spacer(Modifier.height(FightSpacing.xSmall))
            Text(
                text = stringResource(R.string.app_version_format, currentVersion),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun AppUpdateCard(
    state: SettingsUiState,
    onCheckUpdates: () -> Unit,
) {
    val uriHandler = LocalUriHandler.current

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceContainer,
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = FightElevation.card),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(FightSpacing.large),
            verticalArrangement = Arrangement.spacedBy(FightSpacing.medium),
        ) {
            Text(
                text = stringResource(R.string.app_version_label),
                style = MaterialTheme.typography.titleMedium,
            )

            when (state) {
                is SettingsUiState.Idle -> {
                    Text(
                        text = stringResource(R.string.check_updates_description),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Button(
                        onClick = onCheckUpdates,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(stringResource(R.string.check_updates))
                    }
                }

                is SettingsUiState.Checking -> {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        CircularProgressIndicator(modifier = Modifier.size(24.dp))
                        Spacer(Modifier.padding(FightSpacing.small))
                        Text(
                            text = stringResource(R.string.checking_updates),
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }

                is SettingsUiState.UpToDate -> {
                    Surface(
                        color = MaterialTheme.colorScheme.secondaryContainer,
                        shape = MaterialTheme.shapes.small,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(
                            text = stringResource(R.string.app_up_to_date),
                            modifier = Modifier.padding(FightSpacing.medium),
                            color = MaterialTheme.colorScheme.onSecondaryContainer,
                            style = MaterialTheme.typography.bodyMedium,
                        )
                    }
                    OutlinedButton(
                        onClick = onCheckUpdates,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(stringResource(R.string.check_updates_again))
                    }
                }

                is SettingsUiState.UpdateAvailable -> {
                    Surface(
                        color = MaterialTheme.colorScheme.primaryContainer,
                        shape = MaterialTheme.shapes.small,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Column(modifier = Modifier.padding(FightSpacing.medium)) {
                            Text(
                                text = stringResource(
                                    R.string.update_available,
                                    state.updateInfo.latestVersion,
                                ),
                                color = MaterialTheme.colorScheme.onPrimaryContainer,
                                style = MaterialTheme.typography.titleSmall,
                            )
                            if (state.updateInfo.releaseNotes.isNotEmpty()) {
                                Spacer(Modifier.height(FightSpacing.xSmall))
                                Text(
                                    text = state.updateInfo.releaseNotes,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer,
                                    style = MaterialTheme.typography.bodySmall,
                                )
                            }
                        }
                    }
                    Button(
                        onClick = { uriHandler.openUri(state.updateInfo.downloadUrl) },
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(stringResource(R.string.download_update))
                    }
                }

                is SettingsUiState.Error -> {
                    Surface(
                        color = MaterialTheme.colorScheme.errorContainer,
                        shape = MaterialTheme.shapes.small,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(
                            text = stringResource(R.string.update_error),
                            modifier = Modifier.padding(FightSpacing.medium),
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            style = MaterialTheme.typography.bodyMedium,
                        )
                    }
                    Button(
                        onClick = onCheckUpdates,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(stringResource(R.string.retry))
                    }
                }
            }
        }
    }
}
