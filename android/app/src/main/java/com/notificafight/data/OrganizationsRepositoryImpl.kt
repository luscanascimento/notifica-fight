package com.notificafight.data

import com.notificafight.core.database.OrganizationDao
import com.notificafight.core.database.OrganizationEntity
import com.notificafight.core.network.OrganizationApi
import com.notificafight.core.network.RemoteOrganization
import com.notificafight.domain.model.Organization
import com.notificafight.domain.repository.OrganizationsRepository
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

@Singleton
class OrganizationsRepositoryImpl @Inject constructor(
    private val api: OrganizationApi,
    private val organizationDao: OrganizationDao,
) : OrganizationsRepository {
    override fun observeOrganizations(): Flow<List<Organization>> =
        organizationDao.observeAll().map { organizations ->
            organizations.map(OrganizationEntity::toDomain)
        }

    override suspend fun refresh(): Result<Unit> = try {
        val organizations = api.getOrganizations().map(RemoteOrganization::toEntity)
        organizationDao.replaceAll(organizations)
        Result.success(Unit)
    } catch (exception: CancellationException) {
        throw exception
    } catch (exception: Exception) {
        Result.failure(exception)
    }
}

private fun RemoteOrganization.toEntity(): OrganizationEntity {
    validate()
    return OrganizationEntity(id = id, code = code, name = name)
}

private fun OrganizationEntity.toDomain(): Organization = Organization(
    id = id,
    code = code,
    name = name,
)
