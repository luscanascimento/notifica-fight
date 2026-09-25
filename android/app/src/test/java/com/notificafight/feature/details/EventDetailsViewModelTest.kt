package com.notificafight.feature.details

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
class EventDetailsViewModelTest {
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    @Test
    fun `shows refreshed event`() = runTest {
        val event = sampleEvent()
        val repository = FakeDetailsRepository(
            refreshResult = Result.success(Unit),
            eventAfterRefresh = event,
        )
        val viewModel = EventDetailsViewModel(repository)

        viewModel.load(event.id)
        advanceUntilIdle()

        assertEquals(
            EventDetailsUiState.Success(event, showingCachedData = false),
            viewModel.uiState.value,
        )
    }

    @Test
    fun `keeps cached event visible when refresh fails`() = runTest {
        val event = sampleEvent()
        val repository = FakeDetailsRepository(
            initialEvent = event,
            refreshResult = Result.failure(IOException("offline")),
        )
        val viewModel = EventDetailsViewModel(repository)

        viewModel.load(event.id)
        advanceUntilIdle()

        assertEquals(
            EventDetailsUiState.Success(event, showingCachedData = true),
            viewModel.uiState.value,
        )
    }

    @Test
    fun `shows error when refresh fails without cached event`() = runTest {
        val event = sampleEvent()
        val viewModel = EventDetailsViewModel(
            FakeDetailsRepository(refreshResult = Result.failure(IOException("offline"))),
        )

        viewModel.load(event.id)
        advanceUntilIdle()

        assertEquals(EventDetailsUiState.Error, viewModel.uiState.value)
    }
}

private class FakeDetailsRepository(
    initialEvent: CombatEvent? = null,
    private val refreshResult: Result<Unit>,
    private val eventAfterRefresh: CombatEvent? = null,
) : EventsRepository {
    private val event = MutableStateFlow(initialEvent)

    override fun observeUpcomingEvents(): Flow<List<CombatEvent>> = MutableStateFlow(emptyList())

    override fun observeEvent(id: String): Flow<CombatEvent?> = event

    override suspend fun refreshUpcoming(): Result<Unit> = Result.success(Unit)

    override suspend fun refreshEvent(id: String): Result<Unit> {
        eventAfterRefresh?.let { event.value = it }
        return refreshResult
    }
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
