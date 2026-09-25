package com.notificafight.core.database

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "fights",
    foreignKeys = [
        ForeignKey(
            entity = EventEntity::class,
            parentColumns = ["id"],
            childColumns = ["eventId"],
            onDelete = ForeignKey.CASCADE,
        ),
    ],
    indices = [Index(value = ["eventId", "cardPosition"], unique = true)],
)
data class FightEntity(
    @PrimaryKey val id: String,
    val eventId: String,
    val cardPosition: Int,
    val redCornerName: String,
    val blueCornerName: String,
    val weightClass: String?,
    val isTitleFight: Boolean,
)
