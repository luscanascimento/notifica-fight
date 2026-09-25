package com.notificafight.domain.repository

import com.notificafight.domain.model.CombatEvent
import kotlinx.coroutines.flow.Flow

interface EventsRepository {
    fun observeUpcomingEvents(): Flow<List<CombatEvent>>

    fun observeEvent(id: String): Flow<CombatEvent?>

    suspend fun refreshUpcoming(): Result<Unit>

    suspend fun refreshEvent(id: String): Result<Unit>
}
