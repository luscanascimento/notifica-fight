package com.notificafight.core.database

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "organizations",
    indices = [Index(value = ["code"], unique = true)],
)
data class OrganizationEntity(
    @PrimaryKey val id: String,
    val code: String,
    val name: String,
)
