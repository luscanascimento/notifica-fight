package com.notificafight.core.database

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import kotlinx.coroutines.flow.Flow

@Dao
interface OrganizationDao {
    @Query("SELECT * FROM organizations ORDER BY name ASC")
    fun observeAll(): Flow<List<OrganizationEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(organizations: List<OrganizationEntity>)

    @Query("DELETE FROM organizations")
    suspend fun deleteAll()

    @Transaction
    suspend fun replaceAll(organizations: List<OrganizationEntity>) {
        deleteAll()
        insertAll(organizations)
    }
}
