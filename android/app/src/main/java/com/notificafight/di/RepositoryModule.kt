package com.notificafight.di

import com.notificafight.data.UpcomingEventsRepositoryImpl
import com.notificafight.domain.repository.UpcomingEventsRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {
    @Binds
    abstract fun bindUpcomingEventsRepository(
        implementation: UpcomingEventsRepositoryImpl,
    ): UpcomingEventsRepository
}
