package com.notificafight.feature.details

import com.notificafight.domain.model.CombatEvent
import com.notificafight.domain.model.CombatFight

sealed interface EventDetailsUiState {
    data object Loading : EventDetailsUiState

    data class Success(
        val event: CombatEvent,
        val fights: List<CombatFight>,
        val showingCachedData: Boolean,
    ) : EventDetailsUiState

    data object Error : EventDetailsUiState
}
