package com.notificafight.core.database

import androidx.room.Database
import androidx.room.RoomDatabase

@Database(
    entities = [EventEntity::class],
    version = 1,
    exportSchema = true,
)
abstract class FightDatabase : RoomDatabase() {
    abstract fun eventDao(): EventDao
}
