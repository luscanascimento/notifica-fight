package com.notificafight.data

import com.notificafight.core.database.EventDao
import com.notificafight.core.database.EventEntity
import com.notificafight.core.database.FightEntity
import com.notificafight.core.network.EventApi
import com.notificafight.core.network.RemoteEvent
import com.notificafight.core.network.RemoteFight
import com.notificafight.domain.model.EventStatus
import com.notificafight.domain.model.Organization
import com.notificafight.domain.model.CombatEvent
import com.notificafight.domain.model.CombatFight
import com.notificafight.domain.repository.EventsRepository
import java.time.Instant
import java.time.ZoneId
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

@Singleton
class EventsRepositoryImpl @Inject constructor(
    private val api: EventApi,
    private val eventDao: EventDao,
) : EventsRepository {
    override fun observeUpcomingEvents(): Flow<List<CombatEvent>> =
        eventDao.observeUpcoming(System.currentTimeMillis()).map { events ->
            events.map(EventEntity::toDomain)
        }

    override fun observeEvent(id: String): Flow<CombatEvent?> =
        eventDao.observeById(id).map { event -> event?.toDomain() }

    override fun observeEventCard(eventId: String): Flow<List<CombatFight>> =
        eventDao.observeCard(eventId).map { fights -> fights.map(FightEntity::toDomain) }

    override suspend fun refreshUpcoming(): Result<Unit> = try {
        val events = api.getUpcomingEvents().map(RemoteEvent::toEntity)
        eventDao.replaceUpcoming(events)
        Result.success(Unit)
    } catch (exception: CancellationException) {
        throw exception
    } catch (exception: Exception) {
        Result.failure(exception)
    }

    override suspend fun refreshEvent(id: String): Result<Unit> = try {
        val event = api.getEvent(id).toEntity()
        require(event.id == id) { "Event ID does not match the requested resource" }
        val fights = api.getEventCard(id).map { fight -> fight.toEntity(id) }
        eventDao.replaceEventDetails(event, fights)
        Result.success(Unit)
    } catch (exception: CancellationException) {
        throw exception
    } catch (exception: Exception) {
        Result.failure(exception)
    }
}

private fun RemoteFight.toEntity(requestedEventId: String): FightEntity {
    UUID.fromString(id)
    UUID.fromString(eventId)
    require(eventId == requestedEventId) {
        "Fight event ID does not match the requested resource"
    }
    require(cardPosition > 0) { "Card position must be positive" }
    require(redCornerName.isNotBlank() && redCornerName.length <= 120) {
        "Red corner name must contain between 1 and 120 characters"
    }
    require(blueCornerName.isNotBlank() && blueCornerName.length <= 120) {
        "Blue corner name must contain between 1 and 120 characters"
    }
    require(weightClass == null || weightClass.isNotBlank() && weightClass.length <= 80) {
        "Weight class must be null or contain between 1 and 80 characters"
    }
    return FightEntity(
        id = id,
        eventId = eventId,
        cardPosition = cardPosition,
        redCornerName = redCornerName,
        blueCornerName = blueCornerName,
        weightClass = weightClass,
        isTitleFight = isTitleFight,
    )
}

private fun RemoteEvent.toEntity(): EventEntity {
    UUID.fromString(id)
    require(name.isNotBlank()) { "Event name cannot be blank" }
    organization.validate()
    val instant = Instant.parse(startTime)
    ZoneId.of(timezone)
    require(countryCode == null || countryCode.matches(Regex("^[A-Z]{2}$"))) {
        "Country code must use ISO 3166-1 alpha-2 format"
    }
    val parsedStatus = EventStatus.valueOf(status)

    return EventEntity(
        id = id,
        name = name,
        startTimeEpochMillis = instant.toEpochMilli(),
        timezone = timezone,
        status = parsedStatus.name,
        venueName = venueName,
        city = city,
        countryCode = countryCode,
        organizationId = organization.id,
        organizationCode = organization.code,
        organizationName = organization.name,
    )
}

private fun EventEntity.toDomain(): CombatEvent = CombatEvent(
    id = id,
    name = name,
    startTime = Instant.ofEpochMilli(startTimeEpochMillis),
    eventTimezone = timezone,
    status = EventStatus.valueOf(status),
    venueName = venueName,
    city = city,
    countryCode = countryCode,
    organization = Organization(
        id = organizationId,
        code = organizationCode,
        name = organizationName,
    ),
)

private fun FightEntity.toDomain(): CombatFight = CombatFight(
    id = id,
    eventId = eventId,
    cardPosition = cardPosition,
    redCornerName = redCornerName,
    blueCornerName = blueCornerName,
    weightClass = weightClass,
    isTitleFight = isTitleFight,
)
