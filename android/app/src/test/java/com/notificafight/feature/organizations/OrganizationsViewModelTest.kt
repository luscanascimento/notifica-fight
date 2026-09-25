package com.notificafight.feature.organizations

import com.notificafight.MainDispatcherRule
import com.notificafight.domain.model.Organization
import com.notificafight.domain.repository.OrganizationsRepository
import java.io.IOException
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class OrganizationsViewModelTest {
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    @Test
    fun `shows organizations after successful refresh`() = runTest {
        val organization = sampleOrganization()
        val repository = FakeOrganizationsRepository(
            refreshResult = Result.success(Unit),
            organizationsAfterRefresh = listOf(organization),
        )

        val viewModel = OrganizationsViewModel(repository)
        advanceUntilIdle()

        assertEquals(
            OrganizationsUiState.Success(
                organizations = listOf(organization),
                showingCachedData = false,
            ),
            viewModel.uiState.value,
        )
    }

    @Test
    fun `shows empty after successful refresh without organizations`() = runTest {
        val viewModel = OrganizationsViewModel(
            FakeOrganizationsRepository(refreshResult = Result.success(Unit)),
        )

        advanceUntilIdle()

        assertEquals(OrganizationsUiState.Empty, viewModel.uiState.value)
    }

    @Test
    fun `shows error when refresh fails without cache`() = runTest {
        val viewModel = OrganizationsViewModel(
            FakeOrganizationsRepository(
                refreshResult = Result.failure(IOException("offline")),
            ),
        )

        advanceUntilIdle()

        assertEquals(OrganizationsUiState.Error, viewModel.uiState.value)
    }

    @Test
    fun `keeps cached organizations visible when refresh fails`() = runTest {
        val cached = listOf(sampleOrganization())
        val viewModel = OrganizationsViewModel(
            FakeOrganizationsRepository(
                initialOrganizations = cached,
                refreshResult = Result.failure(IOException("offline")),
            ),
        )

        advanceUntilIdle()

        assertEquals(
            OrganizationsUiState.Success(cached, showingCachedData = true),
            viewModel.uiState.value,
        )
    }
}

private class FakeOrganizationsRepository(
    initialOrganizations: List<Organization> = emptyList(),
    private val refreshResult: Result<Unit>,
    private val organizationsAfterRefresh: List<Organization>? = null,
) : OrganizationsRepository {
    private val organizations = MutableStateFlow(initialOrganizations)

    override fun observeOrganizations(): Flow<List<Organization>> = organizations

    override suspend fun refresh(): Result<Unit> {
        organizationsAfterRefresh?.let { organizations.value = it }
        return refreshResult
    }
}

private fun sampleOrganization() = Organization(
    id = "01990000-0000-7000-8000-000000000002",
    code = "ONE",
    name = "ONE Championship",
)
