package com.notificafight.feature.upcoming

import com.notificafight.domain.model.UpcomingEvent

sealed interface UpcomingEventsUiState {
    data object Loading : UpcomingEventsUiState

    data class Success(
        val events: List<UpcomingEvent>,
        val showingCachedData: Boolean,
    ) : UpcomingEventsUiState

    data object Empty : UpcomingEventsUiState

    data object Error : UpcomingEventsUiState
}
