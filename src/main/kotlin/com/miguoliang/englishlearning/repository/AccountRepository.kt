package com.miguoliang.englishlearning.repository

import com.miguoliang.englishlearning.model.Account
import io.quarkus.hibernate.reactive.panache.PanacheRepositoryBase
import io.quarkus.panache.common.Parameters
import io.smallrye.mutiny.coroutines.awaitSuspending
import jakarta.enterprise.context.ApplicationScoped

@ApplicationScoped
class AccountRepository : PanacheRepositoryBase<Account, Long> {
    suspend fun findByUsername(username: String): Account? =
        find("username = :username", Parameters.with("username", username))
            .firstResult<Account>()
            .awaitSuspending()
}
