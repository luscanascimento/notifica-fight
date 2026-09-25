package com.notificafight.core.network

import retrofit2.http.GET
import retrofit2.http.Path

interface EventApi {
    @GET("v1/events/upcoming")
    suspend fun getUpcomingEvents(): List<RemoteEvent>

    @GET("v1/events/{id}")
    suspend fun getEvent(@Path("id") id: String): RemoteEvent
}
