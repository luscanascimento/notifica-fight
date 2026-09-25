package com.notificafight.core.network

import retrofit2.http.GET

interface EventApi {
    @GET("v1/events/upcoming")
    suspend fun getUpcomingEvents(): List<RemoteEvent>
}
