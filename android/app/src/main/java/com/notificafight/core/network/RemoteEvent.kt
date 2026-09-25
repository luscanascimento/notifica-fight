package com.notificafight.core.network

data class RemoteEvent(
    val id: String,
    val name: String,
    val startTime: String,
    val timezone: String,
    val status: String,
    val venueName: String?,
    val city: String?,
    val countryCode: String?,
    val organization: RemoteOrganization,
)
