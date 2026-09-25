package com.notificafight.di

import com.notificafight.data.EventsRepositoryImpl
import com.notificafight.domain.repository.EventsRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {
    @Binds
    abstract fun bindEventsRepository(
        implementation: EventsRepositoryImpl,
    ): EventsRepository
}
