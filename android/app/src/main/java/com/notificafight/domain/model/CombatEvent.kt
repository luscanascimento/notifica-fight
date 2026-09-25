package com.notificafight.domain.model

import java.time.Instant

data class CombatEvent(
    val id: String,
    val name: String,
    val startTime: Instant,
    val eventTimezone: String,
    val status: EventStatus,
    val venueName: String?,
    val city: String?,
    val countryCode: String?,
    val organization: Organization,
)

data class Organization(
    val id: String,
    val code: String,
    val name: String,
)

enum class EventStatus {
    SCHEDULED,
    POSTPONED,
    CANCELED,
    FINISHED,
}
