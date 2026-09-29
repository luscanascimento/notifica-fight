package com.notificafight.core.network

data class RemoteAppVersion(
    val version: String,
    val versionCode: Int,
    val minSupportedVersion: String,
    val downloadUrl: String,
    val releaseNotes: String,
)
