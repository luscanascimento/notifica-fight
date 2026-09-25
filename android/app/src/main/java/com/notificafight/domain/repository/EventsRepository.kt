package com.notificafight.domain.repository

import com.notificafight.domain.model.CombatEvent
import com.notificafight.domain.model.CombatFight
import kotlinx.coroutines.flow.Flow

interface EventsRepository {
    fun observeUpcomingEvents(): Flow<List<CombatEvent>>

    fun observeEvent(id: String): Flow<CombatEvent?>

    fun observeEventCard(eventId: String): Flow<List<CombatFight>>

    suspend fun refreshUpcoming(): Result<Unit>

    suspend fun refreshEvent(id: String): Result<Unit>
}
