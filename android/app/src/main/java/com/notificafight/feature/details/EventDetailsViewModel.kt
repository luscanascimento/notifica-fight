package com.notificafight.feature.details

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.notificafight.domain.model.CombatEvent
import com.notificafight.domain.model.CombatFight
import com.notificafight.domain.repository.EventsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch

@HiltViewModel
class EventDetailsViewModel @Inject constructor(
    private val repository: EventsRepository,
) : ViewModel() {
    private val mutableUiState = MutableStateFlow<EventDetailsUiState>(
        EventDetailsUiState.Loading,
    )
    val uiState: StateFlow<EventDetailsUiState> = mutableUiState.asStateFlow()

    private var selectedEventId: String? = null
    private var latestEvent: CombatEvent? = null
    private var latestFights: List<CombatFight> = emptyList()
    private var refreshFinished = false
    private var lastRefreshFailed = false
    private var observationJob: Job? = null
    private var refreshJob: Job? = null

    fun load(eventId: String) {
        if (selectedEventId == eventId) {
            refresh(eventId)
            return
        }

        selectedEventId = eventId
        latestEvent = null
        latestFights = emptyList()
        refreshFinished = false
        lastRefreshFailed = false
        mutableUiState.value = EventDetailsUiState.Loading
        observationJob?.cancel()
        refreshJob?.cancel()

        observationJob = viewModelScope.launch {
            combine(
                repository.observeEvent(eventId),
                repository.observeEventCard(eventId),
            ) { event, fights -> event to fights }.collect { (event, fights) ->
                latestEvent = event
                latestFights = fights
                updateState()
            }
        }
        refresh(eventId)
    }

    fun retry() {
        selectedEventId?.let(::refresh)
    }

    private fun refresh(eventId: String) {
        if (latestEvent == null) {
            mutableUiState.value = EventDetailsUiState.Loading
        }
        refreshFinished = false
        refreshJob?.cancel()
        refreshJob = viewModelScope.launch {
            val failed = repository.refreshEvent(eventId).isFailure
            if (selectedEventId == eventId) {
                lastRefreshFailed = failed
                refreshFinished = true
                updateState()
            }
        }
    }

    private fun updateState() {
        mutableUiState.value = latestEvent?.let { event ->
            EventDetailsUiState.Success(
                event = event,
                fights = latestFights,
                showingCachedData = lastRefreshFailed,
            )
        } ?: when {
            !refreshFinished || !lastRefreshFailed -> EventDetailsUiState.Loading
            else -> EventDetailsUiState.Error
        }
    }
}
