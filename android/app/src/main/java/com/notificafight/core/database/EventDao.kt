package com.notificafight.core.database

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import kotlinx.coroutines.flow.Flow

@Dao
interface EventDao {
    @Query(
        """
        SELECT * FROM events
        WHERE status IN ('SCHEDULED', 'POSTPONED')
          AND startTimeEpochMillis >= :nowEpochMillis
        ORDER BY startTimeEpochMillis ASC
        """,
    )
    fun observeUpcoming(nowEpochMillis: Long): Flow<List<EventEntity>>

    @Query("SELECT * FROM events WHERE id = :id")
    fun observeById(id: String): Flow<EventEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(events: List<EventEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(event: EventEntity)

    @Query("DELETE FROM events")
    suspend fun deleteAll()

    @Transaction
    suspend fun replaceAll(events: List<EventEntity>) {
        deleteAll()
        insertAll(events)
    }
}
