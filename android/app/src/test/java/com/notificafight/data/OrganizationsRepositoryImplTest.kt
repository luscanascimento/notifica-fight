package com.notificafight.data

import com.notificafight.core.database.OrganizationDao
import com.notificafight.core.database.OrganizationEntity
import com.notificafight.core.network.OrganizationApi
import com.notificafight.core.network.RemoteOrganization
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class OrganizationsRepositoryImplTest {
    @Test
    fun `refresh validates maps and stores organizations`() = runTest {
        val dao = FakeOrganizationDao()
        val repository = OrganizationsRepositoryImpl(
            api = FakeOrganizationApi(listOf(remoteOrganization())),
            organizationDao = dao,
        )

        assertTrue(repository.refresh().isSuccess)

        val organization = repository.observeOrganizations().first().single()
        assertEquals("ONE", organization.code)
        assertEquals("ONE Championship", organization.name)
    }

    @Test
    fun `invalid payload fails without replacing cached organizations`() = runTest {
        val cached = OrganizationEntity(
            id = "01990000-0000-7000-8000-000000000001",
            code = "UFC",
            name = "UFC",
        )
        val dao = FakeOrganizationDao(listOf(cached))
        val invalid = remoteOrganization().copy(id = "not-a-uuid")
        val repository = OrganizationsRepositoryImpl(
            api = FakeOrganizationApi(listOf(invalid)),
            organizationDao = dao,
        )

        assertTrue(repository.refresh().isFailure)
        assertEquals(listOf(cached), dao.organizations.value)
    }

    @Test
    fun `refresh removes organizations that are absent remotely`() = runTest {
        val retained = remoteOrganization()
        val removed = OrganizationEntity(
            id = "01990000-0000-7000-8000-000000000003",
            code = "RWS",
            name = "RWS",
        )
        val dao = FakeOrganizationDao(
            listOf(
                OrganizationEntity(retained.id, retained.code, retained.name),
                removed,
            ),
        )
        val repository = OrganizationsRepositoryImpl(
            api = FakeOrganizationApi(listOf(retained)),
            organizationDao = dao,
        )

        assertTrue(repository.refresh().isSuccess)

        assertEquals(
            listOf(OrganizationEntity(retained.id, retained.code, retained.name)),
            dao.organizations.value,
        )
    }
}

private class FakeOrganizationApi(
    private val response: List<RemoteOrganization>,
) : OrganizationApi {
    override suspend fun getOrganizations(): List<RemoteOrganization> = response
}

private class FakeOrganizationDao(
    initial: List<OrganizationEntity> = emptyList(),
) : OrganizationDao {
    val organizations = MutableStateFlow(initial)

    override fun observeAll(): Flow<List<OrganizationEntity>> = organizations

    override suspend fun insertAll(organizations: List<OrganizationEntity>) {
        this.organizations.value = organizations
    }

    override suspend fun deleteAll() {
        organizations.value = emptyList()
    }
}

private fun remoteOrganization() = RemoteOrganization(
    id = "01990000-0000-7000-8000-000000000002",
    code = "ONE",
    name = "ONE Championship",
)
