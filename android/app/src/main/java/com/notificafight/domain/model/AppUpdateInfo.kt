package com.notificafight.domain.model

data class AppUpdateInfo(
    val currentVersion: String,
    val latestVersion: String,
    val isUpdateAvailable: Boolean,
    val downloadUrl: String,
    val releaseNotes: String,
)
