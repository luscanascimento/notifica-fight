package com.notificafight.core.network

import retrofit2.http.GET

interface OrganizationApi {
    @GET("v1/organizations")
    suspend fun getOrganizations(): List<RemoteOrganization>
}
