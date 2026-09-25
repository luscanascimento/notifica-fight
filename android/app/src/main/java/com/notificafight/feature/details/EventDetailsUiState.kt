package com.notificafight.feature.details

import com.notificafight.domain.model.CombatEvent

sealed interface EventDetailsUiState {
    data object Loading : EventDetailsUiState

    data class Success(
        val event: CombatEvent,
        val showingCachedData: Boolean,
    ) : EventDetailsUiState

    data object Error : EventDetailsUiState
}
