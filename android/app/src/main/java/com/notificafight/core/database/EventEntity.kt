package com.notificafight.core.database

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "events",
    indices = [Index(value = ["status", "startTimeEpochMillis"])],
)
data class EventEntity(
    @PrimaryKey val id: String,
    val name: String,
    val startTimeEpochMillis: Long,
    val timezone: String,
    val status: String,
    val venueName: String?,
    val city: String?,
    val countryCode: String?,
    val organizationId: String,
    val organizationCode: String,
    val organizationName: String,
)
