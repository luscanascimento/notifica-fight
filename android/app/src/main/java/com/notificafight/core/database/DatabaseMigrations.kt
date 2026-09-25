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
