package com.notificafight.feature.upcoming

import com.notificafight.MainDispatcherRule
import com.notificafight.domain.model.EventStatus
import com.notificafight.domain.model.Organization
import com.notificafight.domain.model.CombatEvent
import com.notificafight.domain.repository.EventsRepository
import java.io.IOException
import java.time.Instant
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class UpcomingEventsViewModelTest {
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    @Test
    fun `shows events after successful refresh`() = runTest {
        val event = sampleEvent()
        val repository = FakeRepository(
            refreshResult = Result.success(Unit),
            eventsAfterRefresh = listOf(event),
        )

        val viewModel = UpcomingEventsViewModel(repository)
        advanceUntilIdle()

        assertEquals(
            UpcomingEventsUiState.Success(listOf(event), showingCachedData = false),
            viewModel.uiState.value,
        )
    }

    @Test
    fun `shows empty after a successful refresh with no events`() = runTest {
        val viewModel = UpcomingEventsViewModel(
            FakeRepository(refreshResult = Result.success(Unit)),
        )

        advanceUntilIdle()

        assertEquals(UpcomingEventsUiState.Empty, viewModel.uiState.value)
    }

    @Test
    fun `shows error when refresh fails and cache is empty`() = runTest {
        val viewModel = UpcomingEventsViewModel(
            FakeRepository(refreshResult = Result.failure(IOException("offline"))),
        )

        advanceUntilIdle()

        assertEquals(UpcomingEventsUiState.Error, viewModel.uiState.value)
    }

    @Test
    fun `keeps cached events visible when refresh fails`() = runTest {
        val cached = listOf(sampleEvent())
        val viewModel = UpcomingEventsViewModel(
            FakeRepository(
                initialEvents = cached,
                refreshResult = Result.failure(IOException("offline")),
            ),
        )

        advanceUntilIdle()

        assertEquals(
            UpcomingEventsUiState.Success(cached, showingCachedData = true),
            viewModel.uiState.value,
        )
    }
}

private class FakeRepository(
    initialEvents: List<CombatEvent> = emptyList(),
    private val refreshResult: Result<Unit>,
    private val eventsAfterRefresh: List<CombatEvent>? = null,
) : EventsRepository {
    private val events = MutableStateFlow(initialEvents)

    override fun observeUpcomingEvents(): Flow<List<CombatEvent>> = events

    override fun observeEvent(id: String): Flow<CombatEvent?> =
        MutableStateFlow(events.value.find { it.id == id })

    override suspend fun refreshUpcoming(): Result<Unit> {
        eventsAfterRefresh?.let { events.value = it }
        return refreshResult
    }

    override suspend fun refreshEvent(id: String): Result<Unit> = refreshResult
}

private fun sampleEvent() = CombatEvent(
    id = "01990000-0000-7000-8000-000000000101",
    name = "[DEV] Example Event",
    startTime = Instant.parse("2030-01-12T23:00:00Z"),
    eventTimezone = "America/New_York",
    status = EventStatus.SCHEDULED,
    venueName = null,
    city = "Example City",
    countryCode = "US",
    organization = Organization(
        id = "01990000-0000-7000-8000-000000000001",
        code = "UFC",
        name = "UFC",
    ),
)
