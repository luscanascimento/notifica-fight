package com.notificafight.di

import android.content.Context
import androidx.room.Room
import com.notificafight.BuildConfig
import com.notificafight.core.database.EventDao
import com.notificafight.core.database.FightDatabase
import com.notificafight.core.database.MIGRATION_1_2
import com.notificafight.core.database.OrganizationDao
import com.notificafight.core.network.EventApi
import com.notificafight.core.network.OrganizationApi
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import java.util.concurrent.TimeUnit

@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): FightDatabase =
        Room.databaseBuilder(context, FightDatabase::class.java, "notifica-fight.db")
            .addMigrations(MIGRATION_1_2)
            .build()

    @Provides
    fun provideEventDao(database: FightDatabase): EventDao = database.eventDao()

    @Provides
    fun provideOrganizationDao(database: FightDatabase): OrganizationDao =
        database.organizationDao()

    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .callTimeout(20, TimeUnit.SECONDS)
        .build()

    @Provides
    @Singleton
    fun provideRetrofit(client: OkHttpClient): Retrofit {
        require(BuildConfig.API_BASE_URL.endsWith('/')) { "API base URL must end with /" }
        val moshi = Moshi.Builder().add(KotlinJsonAdapterFactory()).build()
        return Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(client)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
    }

    @Provides
    fun provideEventApi(retrofit: Retrofit): EventApi = retrofit.create(EventApi::class.java)

    @Provides
    fun provideOrganizationApi(retrofit: Retrofit): OrganizationApi =
        retrofit.create(OrganizationApi::class.java)
}
