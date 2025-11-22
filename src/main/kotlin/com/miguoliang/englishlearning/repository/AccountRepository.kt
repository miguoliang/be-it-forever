package com.miguoliang.englishlearning.repository

import com.miguoliang.englishlearning.model.Account
import org.springframework.data.repository.reactive.ReactiveCrudRepository
import org.springframework.stereotype.Repository
import reactor.core.publisher.Mono

@Repository
interface AccountRepository : ReactiveCrudRepository<Account, Long> {
    fun findByUsername(username: String): Mono<Account>
}
