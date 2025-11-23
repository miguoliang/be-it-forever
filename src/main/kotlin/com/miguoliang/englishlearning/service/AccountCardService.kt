package com.miguoliang.englishlearning.service

import com.miguoliang.englishlearning.common.Page
import com.miguoliang.englishlearning.common.Pageable
import com.miguoliang.englishlearning.dto.AccountCardListProjection
import com.miguoliang.englishlearning.model.AccountCard
import com.miguoliang.englishlearning.model.ReviewHistory
import com.miguoliang.englishlearning.repository.AccountCardRepository
import com.miguoliang.englishlearning.repository.ReviewHistoryRepository
import io.smallrye.mutiny.coroutines.awaitSuspending
import jakarta.inject.Singleton
import java.time.LocalDateTime

/**
 * Manages account card operations and reviews.
 */
@Singleton
class AccountCardService(
    private val accountCardRepository: AccountCardRepository,
    private val reviewHistoryRepository: ReviewHistoryRepository,
    private val paginationHelper: PaginationHelper,
    private val sm2Algorithm: Sm2Algorithm,
) {
    /**
     * Initialize cards for account.
     * Note: This is typically called automatically during signup via Temporal workflow.
     * This method is for manual initialization if needed.
     *
     * @param accountId Account ID
     * @param cardTypeCodes Optional list of card type codes (if null, initializes for all types)
     * @return count of created cards
     */
    suspend fun initializeCards(
        accountId: Long,
        cardTypeCodes: List<String>?,
    ): Int {
        // TODO: This should trigger Temporal workflow for card initialization
        // For now, this is a placeholder
        return 0
    }

    /**
     * Get cards due for review.
     *
     * @param accountId Account ID
     * @param pageable Pagination parameters
     * @param cardTypeCode Optional card type filter
     * @return Page of AccountCard items
     */
    suspend fun getDueCards(
        accountId: Long,
        pageable: Pageable,
        cardTypeCode: String? = null,
    ): Page<AccountCard> {
        val now = LocalDateTime.now()
        return if (cardTypeCode != null) {
            paginationHelper.paginate(
                accountCardRepository.findDueCardsByAccountIdAndCardTypeCode(
                    accountId,
                    now,
                    cardTypeCode,
                    pageable,
                ),
                accountCardRepository.countDueCardsByAccountIdAndCardTypeCode(accountId, now, cardTypeCode),
                pageable,
            )
        } else {
            paginationHelper.paginate(
                accountCardRepository.findDueCardsByAccountId(accountId, now, pageable),
                accountCardRepository.countDueCardsByAccountId(accountId, now),
                pageable,
            )
        }
    }

    /**
     * Process review and update SM-2 state.
     *
     * @param accountId Account ID
     * @param cardId Card ID
     * @param quality Quality rating (0-5)
     * @return updated AccountCard
     */
    suspend fun reviewCard(
        accountId: Long,
        cardId: Long,
        quality: Int,
    ): AccountCard {
        val card =
            accountCardRepository.findById(cardId).awaitSuspending()
                ?: throw IllegalStateException("Card not found")

        if (card.accountId != accountId) {
            throw IllegalArgumentException("Card does not belong to account")
        }

        // Apply SM-2 algorithm
        val reviewedCard = sm2Algorithm.calculateNextReview(card, quality)
        val updatedCard =
            AccountCard(
                id = reviewedCard.id,
                accountId = reviewedCard.accountId,
                knowledgeCode = reviewedCard.knowledgeCode,
                cardTypeCode = reviewedCard.cardTypeCode,
                easeFactor = reviewedCard.easeFactor,
                intervalDays = reviewedCard.intervalDays,
                repetitions = reviewedCard.repetitions,
                nextReviewDate = reviewedCard.nextReviewDate,
                lastReviewedAt = reviewedCard.lastReviewedAt,
                createdAt = reviewedCard.createdAt,
                updatedAt = java.time.Instant.now(),
                createdBy = reviewedCard.createdBy,
                updatedBy = reviewedCard.updatedBy,
            )

        // Save updated card (use persist instead of persistAndFlush for better reactive performance)
        // Panache automatically manages transactions for repository operations
        accountCardRepository.persist(updatedCard).awaitSuspending()

        // Create review history entry
        val savedCardId =
            updatedCard.id
                ?: throw IllegalStateException("Saved card must have an ID")

        val reviewHistory =
            ReviewHistory(
                id = null,
                accountCardId = savedCardId,
                quality = quality,
                reviewedAt = LocalDateTime.now(),
                createdBy = null,
            )
        // Use persist instead of persistAndFlush - transaction will flush automatically
        reviewHistoryRepository.persist(reviewHistory).awaitSuspending()

        // Transaction flush will happen automatically on commit
        return updatedCard
    }

    /**
     * Uses single JOIN query instead of 3 separate queries.
     *
     * Performance: ~60-70% reduction in database round-trips and data transfer.
     *
     * @param accountId Account ID
     * @param pageable Pagination parameters
     * @param cardTypeCode Optional card type filter
     * @param status Optional status filter
     * @return List of projections that can be converted to DTOs without additional queries
     */
    suspend fun getAccountCards(
        accountId: Long,
        pageable: Pageable,
        cardTypeCode: String? = null,
        status: AccountCardRepository.StatusFilter? = null,
    ): List<AccountCardListProjection> {
        val now = LocalDateTime.now()

        return accountCardRepository.findProjectionsWithFilters(
            accountId = accountId,
            pageable = pageable,
            cardTypeCode = cardTypeCode,
            statusFilter = status,
            now = if (status == AccountCardRepository.StatusFilter.DUE) now else null,
        )
    }

    /**
     * Get count of cards matching filters.
     * Used for pagination metadata.
     */
    suspend fun getCountWithFilters(
        accountId: Long,
        cardTypeCode: String? = null,
        status: AccountCardRepository.StatusFilter? = null,
    ): Long {
        val now = LocalDateTime.now()

        return accountCardRepository.countWithFilters(
            accountId = accountId,
            cardTypeCode = cardTypeCode,
            statusFilter = status,
            now = if (status == AccountCardRepository.StatusFilter.DUE) now else null,
        )
    }

    /**
     * Get single card by ID.
     *
     * @param accountId Account ID
     * @param cardId Card ID
     * @return AccountCard or null if not found or doesn't belong to account
     */
    suspend fun getCardById(
        accountId: Long,
        cardId: Long,
    ): AccountCard? {
        val card = accountCardRepository.findById(cardId).awaitSuspending()
        return if (card != null && card.accountId == accountId) card else null
    }
}
