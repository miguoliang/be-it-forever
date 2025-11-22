package com.miguoliang.englishlearning.repository

import com.miguoliang.englishlearning.model.ReviewHistory
import org.springframework.data.repository.reactive.ReactiveCrudRepository
import org.springframework.stereotype.Repository
import reactor.core.publisher.Flux

@Repository
interface ReviewHistoryRepository : ReactiveCrudRepository<ReviewHistory, Long> {
    fun findByAccountCardId(accountCardId: Long): Flux<ReviewHistory>
}
