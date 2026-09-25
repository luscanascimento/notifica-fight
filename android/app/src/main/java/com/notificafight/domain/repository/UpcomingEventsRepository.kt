package com.notificafight.domain.repository

import com.notificafight.domain.model.UpcomingEvent
import kotlinx.coroutines.flow.Flow

interface UpcomingEventsRepository {
    fun observeUpcomingEvents(): Flow<List<UpcomingEvent>>

    suspend fun refresh(): Result<Unit>
}
