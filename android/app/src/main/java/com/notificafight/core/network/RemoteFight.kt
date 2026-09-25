package com.notificafight.core.network

data class RemoteFight(
    val id: String,
    val eventId: String,
    val cardPosition: Int,
    val redCornerName: String,
    val blueCornerName: String,
    val weightClass: String?,
    val isTitleFight: Boolean,
)
