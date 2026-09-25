package com.notificafight.data

import com.notificafight.core.database.EventDao
import com.notificafight.core.database.EventEntity
import com.notificafight.core.network.EventApi
import com.notificafight.core.network.RemoteEvent
import com.notificafight.core.network.RemoteOrganization
import com.notificafight.domain.model.EventStatus
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class UpcomingEventsRepositoryImplTest {
    @Test
    fun `refresh validates maps and stores remote events`() = runTest {
        val dao = FakeEventDao()
        val repository = UpcomingEventsRepositoryImpl(
            api = FakeEventApi(listOf(remoteEvent())),
            eventDao = dao,
        )

        assertTrue(repository.refresh().isSuccess)
        val cached = repository.observeUpcomingEvents().first()

        assertEquals(1, cached.size)
        assertEquals("[DEV] Example Event", cached.single().name)
        assertEquals(EventStatus.SCHEDULED, cached.single().status)
        assertEquals("UFC", cached.single().organization.code)
    }

    @Test
    fun `invalid payload fails without replacing cached events`() = runTest {
        val existing = EventEntity(
            id = "01990000-0000-7000-8000-000000000100",
            name = "Cached Event",
            startTimeEpochMillis = 1_893_456_000_000,
            timezone = "UTC",
            status = "SCHEDULED",
            venueName = null,
            city = null,
            countryCode = null,
            organizationId = "01990000-0000-7000-8000-000000000001",
            organizationCode = "UFC",
            organizationName = "UFC",
        )
        val dao = FakeEventDao(listOf(existing))
        val invalid = remoteEvent().copy(timezone = "not-a-timezone")
        val repository = UpcomingEventsRepositoryImpl(FakeEventApi(listOf(invalid)), dao)

        assertTrue(repository.refresh().isFailure)
        assertEquals("Cached Event", dao.events.value.single().name)
    }
}

private class FakeEventApi(
    private val response: List<RemoteEvent>,
) : EventApi {
    override suspend fun getUpcomingEvents(): List<RemoteEvent> = response
}

private class FakeEventDao(initial: List<EventEntity> = emptyList()) : EventDao {
    val events = MutableStateFlow(initial)

    override fun observeUpcoming(nowEpochMillis: Long): Flow<List<EventEntity>> = events

    override suspend fun insertAll(events: List<EventEntity>) {
        this.events.value = events
    }

    override suspend fun deleteAll() {
        events.value = emptyList()
    }
}

private fun remoteEvent() = RemoteEvent(
    id = "01990000-0000-7000-8000-000000000101",
    name = "[DEV] Example Event",
    startTime = "2030-01-12T23:00:00.000Z",
    timezone = "America/New_York",
    status = "SCHEDULED",
    venueName = null,
    city = "Example City",
    countryCode = "US",
    organization = RemoteOrganization(
        id = "01990000-0000-7000-8000-000000000001",
        code = "UFC",
        name = "UFC",
    ),
)
