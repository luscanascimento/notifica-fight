package com.notificafight.data

import com.notificafight.core.network.RemoteOrganization
import java.util.UUID

internal fun RemoteOrganization.validate(): RemoteOrganization {
    UUID.fromString(id)
    require(code.isNotBlank() && code.length <= 32) {
        "Organization code must contain between 1 and 32 characters"
    }
    require(name.isNotBlank() && name.length <= 120) {
        "Organization name must contain between 1 and 120 characters"
    }
    return this
}
