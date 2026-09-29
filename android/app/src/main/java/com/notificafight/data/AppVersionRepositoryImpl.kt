package com.notificafight.data

import com.notificafight.BuildConfig
import com.notificafight.core.network.AppVersionApi
import com.notificafight.domain.model.AppUpdateInfo
import com.notificafight.domain.repository.AppVersionRepository
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.CancellationException

@Singleton
class AppVersionRepositoryImpl @Inject constructor(
    private val api: AppVersionApi,
) : AppVersionRepository {
    override suspend fun checkForUpdates(): Result<AppUpdateInfo> = try {
        val remote = api.getAppVersion()
        val currentVersion = BuildConfig.VERSION_NAME
        val currentCode = BuildConfig.VERSION_CODE
        val isUpdateAvailable = remote.versionCode > currentCode || remote.version != currentVersion
        Result.success(
            AppUpdateInfo(
                currentVersion = currentVersion,
                latestVersion = remote.version,
                isUpdateAvailable = isUpdateAvailable,
                downloadUrl = remote.downloadUrl,
                releaseNotes = remote.releaseNotes,
            ),
        )
    } catch (exception: CancellationException) {
        throw exception
    } catch (exception: Exception) {
        Result.failure(exception)
    }
}
