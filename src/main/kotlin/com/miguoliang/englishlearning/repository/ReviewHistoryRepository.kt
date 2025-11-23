package com.miguoliang.englishlearning.repository

import com.miguoliang.englishlearning.model.ReviewHistory
import io.quarkus.hibernate.reactive.panache.PanacheRepository
import io.smallrye.mutiny.coroutines.awaitSuspending
import jakarta.enterprise.context.ApplicationScoped

@ApplicationScoped
class ReviewHistoryRepository : PanacheRepository<ReviewHistory> {
    suspend fun findByAccountCardId(accountCardId: Long): List<ReviewHistory> =
        find("accountCardId", accountCardId).list<ReviewHistory>().awaitSuspending()
}
