package com.miguoliang.englishlearning.dto

import java.math.BigDecimal
import java.time.LocalDateTime

/**
 * Optimized projection DTO for AccountCard list queries.
 * Fetches only needed fields via JOIN query to avoid N+1 queries and reduce data transfer.
 *
 * Performance: Single query with JOINs instead of 3 separate queries:
 * - 1 query: AccountCard + Knowledge + CardType via JOIN
 * vs
 * - Old: AccountCard query + Knowledge batch query + CardType batch query
 */
data class AccountCardListProjection(
    // AccountCard fields
    val id: Long,
    val easeFactor: BigDecimal,
    val intervalDays: Int,
    val repetitions: Int,
    val nextReviewDate: LocalDateTime,
    val lastReviewedAt: LocalDateTime?,
    // Knowledge fields (minimal)
    val knowledgeCode: String,
    val knowledgeName: String,
    val knowledgeDescription: String?,
    val knowledgeMetadataLevel: String?,
    // CardType fields (minimal)
    val cardTypeCode: String,
    val cardTypeName: String,
    val cardTypeDescription: String?,
) {
    /**
     * Converts projection to AccountCardDto.
     * No additional database queries needed.
     */
    fun toDto(
        front: String? = null,
        back: String? = null,
    ): AccountCardDto =
        AccountCardDto(
            id = id,
            knowledge =
                KnowledgeDto(
                    code = knowledgeCode,
                    name = knowledgeName,
                    description = knowledgeDescription,
                    metadata = knowledgeMetadataLevel?.let { mapOf("level" to it) },
                ),
            cardType =
                CardTypeDto(
                    code = cardTypeCode,
                    name = cardTypeName,
                    description = cardTypeDescription,
                ),
            front = front,
            back = back,
            easeFactor = easeFactor,
            intervalDays = intervalDays,
            repetitions = repetitions,
            nextReviewDate = nextReviewDate,
            lastReviewedAt = lastReviewedAt,
        )
}
