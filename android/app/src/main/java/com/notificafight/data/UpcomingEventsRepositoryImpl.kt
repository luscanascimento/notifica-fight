package com.notificafight.data

import com.notificafight.core.database.EventDao
import com.notificafight.core.database.EventEntity
import com.notificafight.core.network.EventApi
import com.notificafight.core.network.RemoteEvent
import com.notificafight.domain.model.EventStatus
import com.notificafight.domain.model.Organization
import com.notificafight.domain.model.UpcomingEvent
import com.notificafight.domain.repository.UpcomingEventsRepository
import java.time.Instant
import java.time.ZoneId
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

@Singleton
class UpcomingEventsRepositoryImpl @Inject constructor(
    private val api: EventApi,
    private val eventDao: EventDao,
) : UpcomingEventsRepository {
    override fun observeUpcomingEvents(): Flow<List<UpcomingEvent>> =
        eventDao.observeUpcoming(System.currentTimeMillis()).map { events ->
            events.map(EventEntity::toDomain)
        }

    override suspend fun refresh(): Result<Unit> = try {
        val events = api.getUpcomingEvents().map(RemoteEvent::toEntity)
        eventDao.replaceAll(events)
        Result.success(Unit)
    } catch (exception: CancellationException) {
        throw exception
    } catch (exception: Exception) {
        Result.failure(exception)
    }
}

private fun RemoteEvent.toEntity(): EventEntity {
    UUID.fromString(id)
    UUID.fromString(organization.id)
    require(name.isNotBlank()) { "Event name cannot be blank" }
    require(organization.code.isNotBlank()) { "Organization code cannot be blank" }
    require(organization.name.isNotBlank()) { "Organization name cannot be blank" }
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

private fun EventEntity.toDomain(): UpcomingEvent = UpcomingEvent(
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
