package com.notificafight.core.database

import androidx.room.Database
import androidx.room.RoomDatabase

@Database(
    entities = [EventEntity::class, OrganizationEntity::class],
    version = 2,
    exportSchema = true,
)
abstract class FightDatabase : RoomDatabase() {
    abstract fun eventDao(): EventDao

    abstract fun organizationDao(): OrganizationDao
}
