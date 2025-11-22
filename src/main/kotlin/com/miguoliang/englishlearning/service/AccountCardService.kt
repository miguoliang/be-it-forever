package com.miguoliang.englishlearning.service

import com.miguoliang.englishlearning.model.AccountCard
import com.miguoliang.englishlearning.model.ReviewHistory
import com.miguoliang.englishlearning.repository.AccountCardRepository
import com.miguoliang.englishlearning.repository.ReviewHistoryRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import reactor.core.publisher.Mono
import java.time.LocalDateTime

/**
 * Manages account card operations and reviews.
 */
@Service
class AccountCardService(
    private val accountCardRepository: AccountCardRepository,
    private val reviewHistoryRepository: ReviewHistoryRepository,
    private val paginationHelper: ReactivePaginationHelper,
) {
    /**
     * Initialize cards for account.
     * Note: This is typically called automatically during signup via Temporal workflow.
     * This method is for manual initialization if needed.
     * 
     * @param accountId Account ID
     * @param cardTypeCodes Optional list of card type codes (if null, initializes for all types)
     * @return Mono containing count of created cards
     */
    fun initializeCards(
        accountId: Long,
        cardTypeCodes: List<String>?,
    ): Mono<Int> {
        // TODO: This should trigger Temporal workflow for card initialization
        // For now, this is a placeholder
        return Mono.just(0)
    }

    /**
     * Get cards due for review.
     * 
     * @param accountId Account ID
     * @param pageable Pagination parameters
     * @param cardTypeCode Optional card type filter
     * @return Mono containing Page of AccountCard items
     */
    fun getDueCards(
        accountId: Long,
        pageable: Pageable,
        cardTypeCode: String? = null,
    ): Mono<Page<AccountCard>> {
        val now = LocalDateTime.now()
        val (dataQuery, countQuery) =
            if (cardTypeCode != null) {
                Pair(
                    accountCardRepository.findDueCardsByAccountIdAndCardTypeCode(
                        accountId,
                        now,
                        cardTypeCode,
                        pageable,
                    ),
                    accountCardRepository.countDueCardsByAccountIdAndCardTypeCode(
                        accountId,
                        now,
                        cardTypeCode,
                    ),
                )
            } else {
                Pair(
                    accountCardRepository.findDueCardsByAccountId(accountId, now, pageable),
                    accountCardRepository.countDueCardsByAccountId(accountId, now),
                )
            }

        return paginationHelper.paginate(dataQuery, countQuery, pageable)
    }

    /**
     * Process review and update SM-2 state.
     * 
     * @param accountId Account ID
     * @param cardId Card ID
     * @param quality Quality rating (0-5)
     * @return Mono containing updated AccountCard
     */
    fun reviewCard(
        accountId: Long,
        cardId: Long,
        quality: Int,
    ): Mono<AccountCard> =
        accountCardRepository
            .findById(cardId)
            .filter { it.accountId == accountId }
            .switchIfEmpty(Mono.error(IllegalArgumentException("Card not found or does not belong to account")))
            .flatMap { card ->
                // Apply SM-2 algorithm
                val updatedCard =
                    Sm2Algorithm
                        .calculateNextReview(card, quality)
                        .copy(updatedAt = java.time.Instant.now())

                // Save updated card
                accountCardRepository
                    .save(updatedCard)
                    .flatMap { savedCard ->
                        // Create review history entry
                        val reviewHistory =
                            ReviewHistory(
                                id = null,
                                accountCardId = savedCard.id!!,
                                quality = quality,
                                reviewedAt = LocalDateTime.now(),
                                createdBy = null,
                            )
                        reviewHistoryRepository
                            .save(reviewHistory)
                            .thenReturn(savedCard)
                    }
            }

    /**
     * List account cards with filters.
     * 
     * @param accountId Account ID
     * @param pageable Pagination parameters
     * @param cardTypeCode Optional card type filter
     * @param status Optional status filter (new, learning, review, all)
     *   - `new`: repetitions = 0
     *   - `learning`: repetitions > 0 and < 3
     *   - `review`: next_review_date <= today
     *   - `all` or null: No status filter
     * @return Mono containing Page of AccountCard items
     */
    fun getAccountCards(
        accountId: Long,
        pageable: Pageable,
        cardTypeCode: String? = null,
        status: String? = null,
    ): Mono<Page<AccountCard>> {
        val now = LocalDateTime.now()
        val effectiveStatus = if (status == null || status == "all") null else status

        val (dataQuery, countQuery) =
            when {
                cardTypeCode != null && effectiveStatus == "new" -> {
                    Pair(
                        accountCardRepository.findByAccountIdAndCardTypeCodeAndStatusNew(
                            accountId,
                            cardTypeCode,
                            pageable,
                        ),
                        accountCardRepository.countByAccountIdAndCardTypeCodeAndStatusNew(accountId, cardTypeCode),
                    )
                }
                cardTypeCode != null && effectiveStatus == "learning" -> {
                    Pair(
                        accountCardRepository.findByAccountIdAndCardTypeCodeAndStatusLearning(
                            accountId,
                            cardTypeCode,
                            pageable,
                        ),
                        accountCardRepository.countByAccountIdAndCardTypeCodeAndStatusLearning(
                            accountId,
                            cardTypeCode,
                        ),
                    )
                }
                cardTypeCode != null && effectiveStatus == "review" -> {
                    Pair(
                        accountCardRepository.findByAccountIdAndCardTypeCodeAndStatusReview(
                            accountId,
                            cardTypeCode,
                            now,
                            pageable,
                        ),
                        accountCardRepository.countByAccountIdAndCardTypeCodeAndStatusReview(
                            accountId,
                            cardTypeCode,
                            now,
                        ),
                    )
                }
                cardTypeCode != null -> {
                    Pair(
                        accountCardRepository.findByAccountIdAndCardTypeCode(accountId, cardTypeCode, pageable),
                        accountCardRepository.countByAccountIdAndCardTypeCode(accountId, cardTypeCode),
                    )
                }
                effectiveStatus == "new" -> {
                    Pair(
                        accountCardRepository.findByAccountIdAndStatusNew(accountId, pageable),
                        accountCardRepository.countByAccountIdAndStatusNew(accountId),
                    )
                }
                effectiveStatus == "learning" -> {
                    Pair(
                        accountCardRepository.findByAccountIdAndStatusLearning(accountId, pageable),
                        accountCardRepository.countByAccountIdAndStatusLearning(accountId),
                    )
                }
                effectiveStatus == "review" -> {
                    Pair(
                        accountCardRepository.findByAccountIdAndStatusReview(accountId, now, pageable),
                        accountCardRepository.countByAccountIdAndStatusReview(accountId, now),
                    )
                }
                else -> {
                    Pair(
                        accountCardRepository.findByAccountId(accountId, pageable),
                        accountCardRepository.countByAccountId(accountId),
                    )
                }
            }

        return paginationHelper.paginate(dataQuery, countQuery, pageable)
    }

    /**
     * Get single card by ID.
     * 
     * @param accountId Account ID
     * @param cardId Card ID
     * @return Mono containing AccountCard or empty if not found
     */
    fun getCardById(
        accountId: Long,
        cardId: Long,
    ): Mono<AccountCard> =
        accountCardRepository
            .findById(cardId)
            .filter { it.accountId == accountId }
}
