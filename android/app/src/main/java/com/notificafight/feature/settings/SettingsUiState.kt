package com.notificafight.feature.settings

import com.notificafight.domain.model.AppUpdateInfo

sealed interface SettingsUiState {
    data class Idle(val currentVersion: String) : SettingsUiState

    data class Checking(val currentVersion: String) : SettingsUiState

    data class UpToDate(val currentVersion: String) : SettingsUiState

    data class UpdateAvailable(
        val currentVersion: String,
        val updateInfo: AppUpdateInfo,
    ) : SettingsUiState

    data class Error(
        val currentVersion: String,
        val message: String,
    ) : SettingsUiState
}
