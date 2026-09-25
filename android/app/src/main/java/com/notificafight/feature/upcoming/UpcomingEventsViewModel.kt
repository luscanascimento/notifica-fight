package com.notificafight.feature.upcoming

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.notificafight.domain.model.CombatEvent
import com.notificafight.domain.repository.EventsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

@HiltViewModel
class UpcomingEventsViewModel @Inject constructor(
    private val repository: EventsRepository,
) : ViewModel() {
    private val mutableUiState = MutableStateFlow<UpcomingEventsUiState>(
        UpcomingEventsUiState.Loading,
    )
    val uiState: StateFlow<UpcomingEventsUiState> = mutableUiState.asStateFlow()

    private var latestEvents: List<CombatEvent> = emptyList()
    private var refreshFinished = false
    private var lastRefreshFailed = false

    init {
        observeEvents()
        refresh()
    }

    fun retry() {
        refresh()
    }

    private fun observeEvents() {
        viewModelScope.launch {
            repository.observeUpcomingEvents().collect { events ->
                latestEvents = events
                updateState()
            }
        }
    }

    private fun refresh() {
        if (latestEvents.isEmpty()) {
            mutableUiState.value = UpcomingEventsUiState.Loading
        }
        refreshFinished = false
        viewModelScope.launch {
            lastRefreshFailed = repository.refreshUpcoming().isFailure
            refreshFinished = true
            updateState()
        }
    }

    private fun updateState() {
        mutableUiState.value = when {
            latestEvents.isNotEmpty() -> UpcomingEventsUiState.Success(
                events = latestEvents,
                showingCachedData = lastRefreshFailed,
            )
            !refreshFinished -> UpcomingEventsUiState.Loading
            lastRefreshFailed -> UpcomingEventsUiState.Error
            else -> UpcomingEventsUiState.Empty
        }
    }
}
