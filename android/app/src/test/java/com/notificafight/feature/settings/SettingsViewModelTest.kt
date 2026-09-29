package com.notificafight.feature.settings

import com.notificafight.MainDispatcherRule
import com.notificafight.domain.model.AppUpdateInfo
import com.notificafight.domain.repository.AppVersionRepository
import java.io.IOException
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class SettingsViewModelTest {
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    @Test
    fun `initial state is idle`() {
        val repository = FakeAppVersionRepository(Result.success(sampleUpdateInfo(isAvailable = false)))
        val viewModel = SettingsViewModel(repository)

        assertTrue(viewModel.uiState.value is SettingsUiState.Idle)
    }

    @Test
    fun `shows up to date when no update is available`() = runTest {
        val repository = FakeAppVersionRepository(Result.success(sampleUpdateInfo(isAvailable = false)))
        val viewModel = SettingsViewModel(repository)

        viewModel.checkForUpdates()
        advanceUntilIdle()

        assertTrue(viewModel.uiState.value is SettingsUiState.UpToDate)
    }

    @Test
    fun `shows update available when newer version exists`() = runTest {
        val updateInfo = sampleUpdateInfo(isAvailable = true, latest = "1.0.0")
        val repository = FakeAppVersionRepository(Result.success(updateInfo))
        val viewModel = SettingsViewModel(repository)

        viewModel.checkForUpdates()
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state is SettingsUiState.UpdateAvailable)
        assertEquals("1.0.0", (state as SettingsUiState.UpdateAvailable).updateInfo.latestVersion)
    }

    @Test
    fun `shows error when check fails`() = runTest {
        val repository = FakeAppVersionRepository(Result.failure(IOException("Network error")))
        val viewModel = SettingsViewModel(repository)

        viewModel.checkForUpdates()
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state is SettingsUiState.Error)
    }
}

private class FakeAppVersionRepository(
    private val result: Result<AppUpdateInfo>,
) : AppVersionRepository {
    override suspend fun checkForUpdates(): Result<AppUpdateInfo> = result
}

private fun sampleUpdateInfo(isAvailable: Boolean, latest: String = "0.1.0") = AppUpdateInfo(
    currentVersion = "0.1.0 (Build 1)",
    latestVersion = latest,
    isUpdateAvailable = isAvailable,
    downloadUrl = "https://github.com/luscanascimento/notifica-fight/releases",
    releaseNotes = "Nova versão disponível",
)
