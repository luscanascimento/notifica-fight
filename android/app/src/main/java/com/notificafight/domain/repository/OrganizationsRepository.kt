package com.notificafight.domain.repository

import com.notificafight.domain.model.Organization
import kotlinx.coroutines.flow.Flow

interface OrganizationsRepository {
    fun observeOrganizations(): Flow<List<Organization>>

    suspend fun refresh(): Result<Unit>
}
