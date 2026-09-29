package com.notificafight

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import com.notificafight.feature.details.EventDetailsRoute
import com.notificafight.feature.details.EventDetailsViewModel
import com.notificafight.feature.organizations.OrganizationsRoute
import com.notificafight.feature.organizations.OrganizationsViewModel
import com.notificafight.feature.settings.SettingsRoute
import com.notificafight.feature.settings.SettingsViewModel
import com.notificafight.feature.upcoming.UpcomingEventsRoute
import com.notificafight.feature.upcoming.UpcomingEventsViewModel
import com.notificafight.ui.theme.FightTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    private val upcomingViewModel: UpcomingEventsViewModel by viewModels()
    private val detailsViewModel: EventDetailsViewModel by viewModels()
    private val organizationsViewModel: OrganizationsViewModel by viewModels()
    private val settingsViewModel: SettingsViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            FightTheme {
                var selectedEventId by rememberSaveable { mutableStateOf<String?>(null) }
                var showingOrganizations by rememberSaveable { mutableStateOf(false) }
                var showingSettings by rememberSaveable { mutableStateOf(false) }

                BackHandler(enabled = selectedEventId != null || showingOrganizations || showingSettings) {
                    when {
                        selectedEventId != null -> selectedEventId = null
                        showingOrganizations -> showingOrganizations = false
                        showingSettings -> showingSettings = false
                    }
                }

                val eventId = selectedEventId
                when {
                    eventId != null -> EventDetailsRoute(
                        eventId = eventId,
                        viewModel = detailsViewModel,
                        onBack = { selectedEventId = null },
                    )
                    showingOrganizations -> OrganizationsRoute(
                        viewModel = organizationsViewModel,
                        onBack = { showingOrganizations = false },
                    )
                    showingSettings -> SettingsRoute(
                        viewModel = settingsViewModel,
                        onBack = { showingSettings = false },
                    )
                    else -> UpcomingEventsRoute(
                        viewModel = upcomingViewModel,
                        onEventClick = { selectedEventId = it },
                        onOrganizationsClick = { showingOrganizations = true },
                        onSettingsClick = { showingSettings = true },
                    )
                }
            }
        }
    }
}
