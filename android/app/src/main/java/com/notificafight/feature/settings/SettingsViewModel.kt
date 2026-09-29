package com.notificafight.feature.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.notificafight.BuildConfig
import com.notificafight.domain.repository.AppVersionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val repository: AppVersionRepository,
) : ViewModel() {
    private val currentVersion = "${BuildConfig.VERSION_NAME} (Build ${BuildConfig.VERSION_CODE})"

    private val mutableUiState = MutableStateFlow<SettingsUiState>(
        SettingsUiState.Idle(currentVersion),
    )
    val uiState: StateFlow<SettingsUiState> = mutableUiState.asStateFlow()

    fun checkForUpdates() {
        mutableUiState.value = SettingsUiState.Checking(currentVersion)
        viewModelScope.launch {
            repository.checkForUpdates()
                .onSuccess { info ->
                    mutableUiState.value = if (info.isUpdateAvailable) {
                        SettingsUiState.UpdateAvailable(currentVersion, info)
                    } else {
                        SettingsUiState.UpToDate(currentVersion)
                    }
                }
                .onFailure { error ->
                    mutableUiState.value = SettingsUiState.Error(
                        currentVersion,
                        error.localizedMessage ?: "Erro ao verificar atualizações",
                    )
                }
        }
    }
}
