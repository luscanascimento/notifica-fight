package com.notificafight.core.network

import retrofit2.http.GET

interface AppVersionApi {
    @GET("v1/app/version")
    suspend fun getAppVersion(): RemoteAppVersion
}
