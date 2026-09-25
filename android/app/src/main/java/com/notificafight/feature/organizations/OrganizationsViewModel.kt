package com.notificafight.feature.organizations

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.notificafight.domain.model.Organization
import com.notificafight.domain.repository.OrganizationsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

@HiltViewModel
class OrganizationsViewModel @Inject constructor(
    private val repository: OrganizationsRepository,
) : ViewModel() {
    private val mutableUiState = MutableStateFlow<OrganizationsUiState>(
        OrganizationsUiState.Loading,
    )
    val uiState: StateFlow<OrganizationsUiState> = mutableUiState.asStateFlow()

    private var latestOrganizations: List<Organization> = emptyList()
    private var refreshFinished = false
    private var lastRefreshFailed = false

    init {
        observeOrganizations()
        refresh()
    }

    fun retry() {
        refresh()
    }

    private fun observeOrganizations() {
        viewModelScope.launch {
            repository.observeOrganizations().collect { organizations ->
                latestOrganizations = organizations
                updateState()
            }
        }
    }

    private fun refresh() {
        if (latestOrganizations.isEmpty()) {
            mutableUiState.value = OrganizationsUiState.Loading
        }
        refreshFinished = false
        viewModelScope.launch {
            lastRefreshFailed = repository.refresh().isFailure
            refreshFinished = true
            updateState()
        }
    }

    private fun updateState() {
        mutableUiState.value = when {
            latestOrganizations.isNotEmpty() -> OrganizationsUiState.Success(
                organizations = latestOrganizations,
                showingCachedData = lastRefreshFailed,
            )
            !refreshFinished -> OrganizationsUiState.Loading
            lastRefreshFailed -> OrganizationsUiState.Error
            else -> OrganizationsUiState.Empty
        }
    }
}
