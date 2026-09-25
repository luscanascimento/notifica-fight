package com.notificafight.core.database

import androidx.room.Dao
import androidx.room.Query
import androidx.room.Transaction
import androidx.room.Upsert
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

    @Query("SELECT * FROM fights WHERE eventId = :eventId ORDER BY cardPosition ASC")
    fun observeCard(eventId: String): Flow<List<FightEntity>>

    @Upsert
    suspend fun upsertAll(events: List<EventEntity>)

    @Upsert
    suspend fun upsert(event: EventEntity)

    @Upsert
    suspend fun upsertFights(fights: List<FightEntity>)

    @Query("DELETE FROM events")
    suspend fun deleteAll()

    @Query("DELETE FROM events WHERE id NOT IN (:eventIds)")
    suspend fun deleteEventsNotIn(eventIds: List<String>)

    @Query("DELETE FROM fights WHERE eventId = :eventId")
    suspend fun deleteCard(eventId: String)

    @Transaction
    suspend fun replaceUpcoming(events: List<EventEntity>) {
        if (events.isEmpty()) {
            deleteAll()
        } else {
            upsertAll(events)
            deleteEventsNotIn(events.map(EventEntity::id))
        }
    }

    @Transaction
    suspend fun replaceEventDetails(event: EventEntity, fights: List<FightEntity>) {
        upsert(event)
        deleteCard(event.id)
        upsertFights(fights)
    }
}
