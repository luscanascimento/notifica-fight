package com.notificafight.feature.organizations

import com.notificafight.domain.model.Organization

sealed interface OrganizationsUiState {
    data object Loading : OrganizationsUiState

    data class Success(
        val organizations: List<Organization>,
        val showingCachedData: Boolean,
    ) : OrganizationsUiState

    data object Empty : OrganizationsUiState

    data object Error : OrganizationsUiState
}
