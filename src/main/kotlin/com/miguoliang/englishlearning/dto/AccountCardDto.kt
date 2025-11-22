package com.miguoliang.englishlearning.dto

import com.fasterxml.jackson.annotation.JsonProperty
import java.time.LocalDateTime

/**
 * DTO for AccountCard API responses.
 * Includes rendered front/back content for due cards.
 */
data class AccountCardDto(
    val id: Long,
    val knowledge: KnowledgeDto,
    val cardType: CardTypeDto,
    val front: String? = null,
    val back: String? = null,
    @JsonProperty("easeFactor")
    val easeFactor: java.math.BigDecimal,
    @JsonProperty("intervalDays")
    val intervalDays: Int,
    val repetitions: Int,
    @JsonProperty("nextReviewDate")
    val nextReviewDate: LocalDateTime,
    @JsonProperty("lastReviewedAt")
    val lastReviewedAt: LocalDateTime?,
)

/**
 * Converts AccountCard entity to DTO.
 * Requires knowledge and cardType DTOs, and optionally rendered front/back content.
 */
fun com.miguoliang.englishlearning.model.AccountCard.toDto(
    knowledge: KnowledgeDto,
    cardType: CardTypeDto,
    front: String? = null,
    back: String? = null,
): AccountCardDto =
    AccountCardDto(
        id = this.id!!,
        knowledge = knowledge,
        cardType = cardType,
        front = front,
        back = back,
        easeFactor = this.easeFactor,
        intervalDays = this.intervalDays,
        repetitions = this.repetitions,
        nextReviewDate = this.nextReviewDate,
        lastReviewedAt = this.lastReviewedAt,
    )
