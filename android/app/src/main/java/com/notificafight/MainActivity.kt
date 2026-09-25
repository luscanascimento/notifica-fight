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
import com.notificafight.feature.upcoming.UpcomingEventsRoute
import com.notificafight.feature.upcoming.UpcomingEventsViewModel
import com.notificafight.ui.theme.FightTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    private val upcomingViewModel: UpcomingEventsViewModel by viewModels()
    private val detailsViewModel: EventDetailsViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            FightTheme {
                var selectedEventId by rememberSaveable { mutableStateOf<String?>(null) }
                BackHandler(enabled = selectedEventId != null) {
                    selectedEventId = null
                }

                val eventId = selectedEventId
                if (eventId == null) {
                    UpcomingEventsRoute(
                        viewModel = upcomingViewModel,
                        onEventClick = { selectedEventId = it },
                    )
                } else {
                    EventDetailsRoute(
                        eventId = eventId,
                        viewModel = detailsViewModel,
                        onBack = { selectedEventId = null },
                    )
                }
            }
        }
    }
}
