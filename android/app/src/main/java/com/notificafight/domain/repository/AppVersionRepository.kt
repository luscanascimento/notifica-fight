package com.notificafight.domain.repository

import com.notificafight.domain.model.AppUpdateInfo

interface AppVersionRepository {
    suspend fun checkForUpdates(): Result<AppUpdateInfo>
}
