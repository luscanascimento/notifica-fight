package com.notificafight.feature.upcoming

import com.notificafight.domain.model.CombatEvent

sealed interface UpcomingEventsUiState {
    data object Loading : UpcomingEventsUiState

    data class Success(
        val events: List<CombatEvent>,
        val showingCachedData: Boolean,
    ) : UpcomingEventsUiState

    data object Empty : UpcomingEventsUiState

    data object Error : UpcomingEventsUiState
}
