package com.miguoliang.englishlearning.repository

import com.miguoliang.englishlearning.model.AccountCard
import org.springframework.data.domain.Pageable
import org.springframework.data.r2dbc.repository.Query
import org.springframework.data.repository.reactive.ReactiveCrudRepository
import org.springframework.stereotype.Repository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.time.LocalDateTime

@Repository
interface AccountCardRepository : ReactiveCrudRepository<AccountCard, Long> {
    fun findByAccountId(accountId: Long): Flux<AccountCard>

    @Query(
        "SELECT * FROM account_cards WHERE account_id = :accountId AND next_review_date <= :date ORDER BY next_review_date OFFSET :#{#pageable.offset} LIMIT :#{#pageable.pageSize}",
    )
    fun findDueCardsByAccountId(
        accountId: Long,
        date: LocalDateTime,
        pageable: Pageable,
    ): Flux<AccountCard>

    @Query("SELECT COUNT(*) FROM account_cards WHERE account_id = :accountId AND next_review_date <= :date")
    fun countDueCardsByAccountId(
        accountId: Long,
        date: LocalDateTime,
    ): Mono<Long>

    @Query(
        "SELECT * FROM account_cards WHERE account_id = :accountId AND next_review_date <= :date AND card_type_code = :cardTypeCode ORDER BY next_review_date OFFSET :#{#pageable.offset} LIMIT :#{#pageable.pageSize}",
    )
    fun findDueCardsByAccountIdAndCardTypeCode(
        accountId: Long,
        date: LocalDateTime,
        cardTypeCode: String,
        pageable: Pageable,
    ): Flux<AccountCard>

    @Query(
        "SELECT COUNT(*) FROM account_cards WHERE account_id = :accountId AND next_review_date <= :date AND card_type_code = :cardTypeCode",
    )
    fun countDueCardsByAccountIdAndCardTypeCode(
        accountId: Long,
        date: LocalDateTime,
        cardTypeCode: String,
    ): Mono<Long>

    fun findByAccountIdAndKnowledgeCodeAndCardTypeCode(
        accountId: Long,
        knowledgeCode: String,
        cardTypeCode: String,
    ): Mono<AccountCard>

    @Query(
        "SELECT * FROM account_cards WHERE account_id = :accountId ORDER BY id OFFSET :#{#pageable.offset} LIMIT :#{#pageable.pageSize}",
    )
    fun findByAccountId(
        accountId: Long,
        pageable: Pageable,
    ): Flux<AccountCard>

    @Query("SELECT COUNT(*) FROM account_cards WHERE account_id = :accountId")
    fun countByAccountId(accountId: Long): Mono<Long>

    @Query(
        "SELECT * FROM account_cards WHERE account_id = :accountId AND card_type_code = :cardTypeCode ORDER BY id OFFSET :#{#pageable.offset} LIMIT :#{#pageable.pageSize}",
    )
    fun findByAccountIdAndCardTypeCode(
        accountId: Long,
        cardTypeCode: String,
        pageable: Pageable,
    ): Flux<AccountCard>

    @Query("SELECT COUNT(*) FROM account_cards WHERE account_id = :accountId AND card_type_code = :cardTypeCode")
    fun countByAccountIdAndCardTypeCode(
        accountId: Long,
        cardTypeCode: String,
    ): Mono<Long>

    @Query(
        "SELECT * FROM account_cards WHERE account_id = :accountId AND repetitions = 0 ORDER BY id OFFSET :#{#pageable.offset} LIMIT :#{#pageable.pageSize}",
    )
    fun findByAccountIdAndStatusNew(
        accountId: Long,
        pageable: Pageable,
    ): Flux<AccountCard>

    @Query("SELECT COUNT(*) FROM account_cards WHERE account_id = :accountId AND repetitions = 0")
    fun countByAccountIdAndStatusNew(accountId: Long): Mono<Long>

    @Query(
        "SELECT * FROM account_cards WHERE account_id = :accountId AND repetitions > 0 AND repetitions < 3 ORDER BY id OFFSET :#{#pageable.offset} LIMIT :#{#pageable.pageSize}",
    )
    fun findByAccountIdAndStatusLearning(
        accountId: Long,
        pageable: Pageable,
    ): Flux<AccountCard>

    @Query("SELECT COUNT(*) FROM account_cards WHERE account_id = :accountId AND repetitions > 0 AND repetitions < 3")
    fun countByAccountIdAndStatusLearning(accountId: Long): Mono<Long>

    @Query(
        "SELECT * FROM account_cards WHERE account_id = :accountId AND next_review_date <= :date ORDER BY id OFFSET :#{#pageable.offset} LIMIT :#{#pageable.pageSize}",
    )
    fun findByAccountIdAndStatusReview(
        accountId: Long,
        date: LocalDateTime,
        pageable: Pageable,
    ): Flux<AccountCard>

    @Query("SELECT COUNT(*) FROM account_cards WHERE account_id = :accountId AND next_review_date <= :date")
    fun countByAccountIdAndStatusReview(
        accountId: Long,
        date: LocalDateTime,
    ): Mono<Long>

    @Query(
        "SELECT * FROM account_cards WHERE account_id = :accountId AND card_type_code = :cardTypeCode AND repetitions = 0 ORDER BY id OFFSET :#{#pageable.offset} LIMIT :#{#pageable.pageSize}",
    )
    fun findByAccountIdAndCardTypeCodeAndStatusNew(
        accountId: Long,
        cardTypeCode: String,
        pageable: Pageable,
    ): Flux<AccountCard>

    @Query(
        "SELECT COUNT(*) FROM account_cards WHERE account_id = :accountId AND card_type_code = :cardTypeCode AND repetitions = 0",
    )
    fun countByAccountIdAndCardTypeCodeAndStatusNew(
        accountId: Long,
        cardTypeCode: String,
    ): Mono<Long>

    @Query(
        "SELECT * FROM account_cards WHERE account_id = :accountId AND card_type_code = :cardTypeCode AND repetitions > 0 AND repetitions < 3 ORDER BY id OFFSET :#{#pageable.offset} LIMIT :#{#pageable.pageSize}",
    )
    fun findByAccountIdAndCardTypeCodeAndStatusLearning(
        accountId: Long,
        cardTypeCode: String,
        pageable: Pageable,
    ): Flux<AccountCard>

    @Query(
        "SELECT COUNT(*) FROM account_cards WHERE account_id = :accountId AND card_type_code = :cardTypeCode AND repetitions > 0 AND repetitions < 3",
    )
    fun countByAccountIdAndCardTypeCodeAndStatusLearning(
        accountId: Long,
        cardTypeCode: String,
    ): Mono<Long>

    @Query(
        "SELECT * FROM account_cards WHERE account_id = :accountId AND card_type_code = :cardTypeCode AND next_review_date <= :date ORDER BY id OFFSET :#{#pageable.offset} LIMIT :#{#pageable.pageSize}",
    )
    fun findByAccountIdAndCardTypeCodeAndStatusReview(
        accountId: Long,
        cardTypeCode: String,
        date: LocalDateTime,
        pageable: Pageable,
    ): Flux<AccountCard>

    @Query(
        "SELECT COUNT(*) FROM account_cards WHERE account_id = :accountId AND card_type_code = :cardTypeCode AND next_review_date <= :date",
    )
    fun countByAccountIdAndCardTypeCodeAndStatusReview(
        accountId: Long,
        cardTypeCode: String,
        date: LocalDateTime,
    ): Mono<Long>
}
