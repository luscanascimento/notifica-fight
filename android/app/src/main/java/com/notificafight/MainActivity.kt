package com.notificafight

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import com.notificafight.feature.upcoming.UpcomingEventsRoute
import com.notificafight.feature.upcoming.UpcomingEventsViewModel
import com.notificafight.ui.theme.FightTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    private val viewModel: UpcomingEventsViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            FightTheme {
                UpcomingEventsRoute(viewModel = viewModel)
            }
        }
    }
}
