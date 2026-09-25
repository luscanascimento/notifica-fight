package com.notificafight.core.database

import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

val MIGRATION_1_2 = object : Migration(1, 2) {
    override fun migrate(db: SupportSQLiteDatabase) {
        db.execSQL(
            """
            CREATE TABLE IF NOT EXISTS organizations (
                id TEXT NOT NULL,
                code TEXT NOT NULL,
                name TEXT NOT NULL,
                PRIMARY KEY(id)
            )
            """.trimIndent(),
        )
        db.execSQL(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS index_organizations_code
            ON organizations (code)
            """.trimIndent(),
        )
        db.execSQL(
            """
            INSERT OR IGNORE INTO organizations (id, code, name)
            SELECT DISTINCT organizationId, organizationCode, organizationName
            FROM events
            """.trimIndent(),
        )
    }
}

val MIGRATION_2_3 = object : Migration(2, 3) {
    override fun migrate(db: SupportSQLiteDatabase) {
        db.execSQL(
            """
            CREATE TABLE IF NOT EXISTS fights (
                id TEXT NOT NULL,
                eventId TEXT NOT NULL,
                cardPosition INTEGER NOT NULL,
                redCornerName TEXT NOT NULL,
                blueCornerName TEXT NOT NULL,
                weightClass TEXT,
                isTitleFight INTEGER NOT NULL,
                PRIMARY KEY(id),
                FOREIGN KEY(eventId) REFERENCES events(id) ON UPDATE NO ACTION ON DELETE CASCADE
            )
            """.trimIndent(),
        )
        db.execSQL(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS index_fights_eventId_cardPosition
            ON fights (eventId, cardPosition)
            """.trimIndent(),
        )
    }
}
