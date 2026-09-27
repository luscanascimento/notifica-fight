package com.notificafight.data

import com.notificafight.core.database.EventDao
import com.notificafight.core.database.EventEntity
import com.notificafight.core.database.FightEntity
import com.notificafight.core.network.EventApi
import com.notificafight.core.network.RemoteEvent
import com.notificafight.core.network.RemoteFight
import com.notificafight.core.network.RemoteOrganization
import com.notificafight.domain.model.EventStatus
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class EventsRepositoryImplTest {
    @Test
    fun `refresh validates maps and stores remote events`() = runTest {
        val dao = FakeEventDao()
        val repository = EventsRepositoryImpl(
            api = FakeEventApi(listOf(remoteEvent())),
            eventDao = dao,
        )

        assertTrue(repository.refreshUpcoming().isSuccess)
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
        val repository = EventsRepositoryImpl(FakeEventApi(listOf(invalid)), dao)

        assertTrue(repository.refreshUpcoming().isFailure)
        assertEquals("Cached Event", dao.events.value.single().name)
    }

    @Test
    fun `upcoming refresh preserves card for an event that remains listed`() = runTest {
        val event = remoteEvent().toEntityForTest()
        val fight = remoteFight(event.id).toEntityForTest()
        val dao = FakeEventDao(listOf(event), listOf(fight))
        val repository = EventsRepositoryImpl(FakeEventApi(listOf(remoteEvent())), dao)

        assertTrue(repository.refreshUpcoming().isSuccess)

        assertEquals(listOf(fight), dao.fights.value)
    }

    @Test
    fun `upcoming refresh removes an event and its card when absent remotely`() = runTest {
        val retainedEvent = remoteEvent().toEntityForTest()
        val removedEvent = remoteEvent().copy(
            id = "01990000-0000-7000-8000-000000000102",
            name = "[DEV] Removed Event",
        ).toEntityForTest()
        val retainedFight = remoteFight(retainedEvent.id).toEntityForTest()
        val removedFight = remoteFight(removedEvent.id).copy(
            id = "01990000-0000-7000-8000-000000000202",
        ).toEntityForTest()
        val dao = FakeEventDao(
            initial = listOf(retainedEvent, removedEvent),
            initialFights = listOf(retainedFight, removedFight),
        )
        val repository = EventsRepositoryImpl(FakeEventApi(listOf(remoteEvent())), dao)

        assertTrue(repository.refreshUpcoming().isSuccess)

        assertEquals(listOf(retainedEvent), dao.events.value)
        assertEquals(listOf(retainedFight), dao.fights.value)
    }

    @Test
    fun `empty upcoming refresh clears cached events and cards`() = runTest {
        val event = remoteEvent().toEntityForTest()
        val fight = remoteFight(event.id).toEntityForTest()
        val dao = FakeEventDao(listOf(event), listOf(fight))
        val repository = EventsRepositoryImpl(FakeEventApi(emptyList()), dao)

        assertTrue(repository.refreshUpcoming().isSuccess)

        assertTrue(dao.events.value.isEmpty())
        assertTrue(dao.fights.value.isEmpty())
    }

    @Test
    fun `refresh event validates and stores the requested event without clearing cache`() = runTest {
        val existing = remoteEvent().copy(
            id = "01990000-0000-7000-8000-000000000100",
            name = "Cached Event",
        ).toEntityForTest()
        val requested = remoteEvent()
        val dao = FakeEventDao(listOf(existing))
        val repository = EventsRepositoryImpl(FakeEventApi(listOf(requested)), dao)

        assertTrue(repository.refreshEvent(requested.id).isSuccess)

        assertEquals(2, dao.events.value.size)
        assertEquals(requested.name, repository.observeEvent(requested.id).first()?.name)
        assertEquals(
            "[DEV] Alex North",
            repository.observeEventCard(requested.id).first().single().redCornerName,
        )
    }

    @Test
    fun `mismatched detail response fails without changing cache`() = runTest {
        val existing = remoteEvent().toEntityForTest()
        val dao = FakeEventDao(listOf(existing))
        val repository = EventsRepositoryImpl(FakeEventApi(listOf(remoteEvent())), dao)

        val result = repository.refreshEvent("01990000-0000-7000-8000-000000000999")

        assertTrue(result.isFailure)
        assertEquals(listOf(existing), dao.events.value)
    }

    @Test
    fun `detail accepts terminal event status`() = runTest {
        val finished = remoteEvent().copy(status = "FINISHED")
        val repository = EventsRepositoryImpl(FakeEventApi(listOf(finished)), FakeEventDao())

        assertTrue(repository.refreshEvent(finished.id).isSuccess)
        assertEquals(EventStatus.FINISHED, repository.observeEvent(finished.id).first()?.status)
    }

    @Test
    fun `invalid card fails without changing cached event details`() = runTest {
        val event = remoteEvent().toEntityForTest()
        val fight = remoteFight(event.id).toEntityForTest()
        val dao = FakeEventDao(listOf(event), listOf(fight))
        val invalidFight = remoteFight(event.id).copy(cardPosition = 0)
        val repository = EventsRepositoryImpl(
            FakeEventApi(listOf(remoteEvent()), listOf(invalidFight)),
            dao,
        )

        assertTrue(repository.refreshEvent(event.id).isFailure)
        assertEquals(listOf(event), dao.events.value)
        assertEquals(listOf(fight), dao.fights.value)
    }
}

private class FakeEventApi(
    private val response: List<RemoteEvent>,
    private val cardResponse: List<RemoteFight> = response.firstOrNull()
        ?.let { event -> listOf(remoteFight(event.id)) }
        .orEmpty(),
) : EventApi {
    override suspend fun getUpcomingEvents(): List<RemoteEvent> = response

    override suspend fun getEvent(id: String): RemoteEvent = response.single()

    override suspend fun getEventCard(id: String): List<RemoteFight> = cardResponse
}

private class FakeEventDao(
    initial: List<EventEntity> = emptyList(),
    initialFights: List<FightEntity> = emptyList(),
) : EventDao {
    val events = MutableStateFlow(initial)
    val fights = MutableStateFlow(initialFights)

    override fun observeUpcoming(nowEpochMillis: Long): Flow<List<EventEntity>> = events

    override fun observeById(id: String): Flow<EventEntity?> =
        events.map { cached -> cached.find { it.id == id } }

    override fun observeCard(eventId: String): Flow<List<FightEntity>> =
        fights.map { cached ->
            cached.filter { it.eventId == eventId }.sortedBy(FightEntity::cardPosition)
        }

    override suspend fun upsertAll(events: List<EventEntity>) {
        val ids = events.mapTo(mutableSetOf(), EventEntity::id)
        this.events.value = this.events.value.filterNot { it.id in ids } + events
    }

    override suspend fun upsert(event: EventEntity) {
        events.value = events.value.filterNot { it.id == event.id } + event
    }

    override suspend fun upsertFights(fights: List<FightEntity>) {
        val ids = fights.mapTo(mutableSetOf(), FightEntity::id)
        this.fights.value = this.fights.value.filterNot { it.id in ids } + fights
    }

    override suspend fun deleteAll() {
        events.value = emptyList()
        fights.value = emptyList()
    }

    override suspend fun deleteEventsNotIn(eventIds: List<String>) {
        events.value = events.value.filter { it.id in eventIds }
        fights.value = fights.value.filter { it.eventId in eventIds }
    }

    override suspend fun deleteCard(eventId: String) {
        fights.value = fights.value.filterNot { it.eventId == eventId }
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

private fun remoteFight(eventId: String) = RemoteFight(
    id = "01990000-0000-7000-8000-000000000201",
    eventId = eventId,
    cardPosition = 1,
    redCornerName = "[DEV] Alex North",
    blueCornerName = "[DEV] Jordan Vale",
    weightClass = "Lightweight",
    isTitleFight = true,
)

private fun RemoteEvent.toEntityForTest() = EventEntity(
    id = id,
    name = name,
    startTimeEpochMillis = java.time.Instant.parse(startTime).toEpochMilli(),
    timezone = timezone,
    status = status,
    venueName = venueName,
    city = city,
    countryCode = countryCode,
    organizationId = organization.id,
    organizationCode = organization.code,
    organizationName = organization.name,
)

private fun RemoteFight.toEntityForTest() = FightEntity(
    id = id,
    eventId = eventId,
    cardPosition = cardPosition,
    redCornerName = redCornerName,
    blueCornerName = blueCornerName,
    weightClass = weightClass,
    isTitleFight = isTitleFight,
)
