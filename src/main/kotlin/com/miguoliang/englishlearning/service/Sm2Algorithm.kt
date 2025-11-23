package com.miguoliang.englishlearning.service

import com.miguoliang.englishlearning.model.AccountCard
import jakarta.enterprise.context.ApplicationScoped
import java.math.BigDecimal
import java.time.LocalDateTime

/**
 * Implements the SM-2 spaced repetition algorithm.
 *
 * SM-2 Algorithm Logic:
 * - Quality < 3 (Failed): Reset repetitions to 0, interval to 1 day, decrease ease factor by 0.2
 * - Quality >= 3 (Passed): Increase repetitions, calculate new interval based on ease factor
 * - Ease factor adjustment: Based on quality rating (0-5 scale)
 * - Minimum ease factor: 1.3
 */
@ApplicationScoped
class Sm2Algorithm {
    companion object {
        private const val MIN_EASE_FACTOR = 1.3
        private const val DEFAULT_EASE_FACTOR = 2.5
        private const val DEFAULT_INTERVAL_DAYS = 1
        private const val DEFAULT_REPETITIONS = 0
    }

    /**
     * Calculates the next review state based on quality rating.
     *
     * @param currentCard The current card state
     * @param quality Quality rating (0-5): 0=again, 1=hard, 2=good, 3=easy, 4=very easy, 5=perfect
     * @return Updated AccountCard with new SM-2 state
     */
    fun calculateNextReview(
        currentCard: AccountCard,
        quality: Int,
    ): AccountCard {
        require(quality in 0..5) { "Quality must be between 0 and 5" }

        val newEaseFactor = calculateNewEaseFactor(currentCard.easeFactor, quality)
        val newRepetitions: Int
        val newIntervalDays: Int

        if (quality < 3) {
            // Failed: Reset repetitions to 0, interval to 1 day
            newRepetitions = 0
            newIntervalDays = 1
        } else {
            // Passed: Increase repetitions and calculate new interval
            newRepetitions = currentCard.repetitions + 1
            newIntervalDays = calculateNewInterval(newRepetitions, newEaseFactor, currentCard.intervalDays)
        }

        val nextReviewDate = LocalDateTime.now().plusDays(newIntervalDays.toLong())
        val now = LocalDateTime.now()

        return AccountCard(
            id = currentCard.id,
            accountId = currentCard.accountId,
            knowledgeCode = currentCard.knowledgeCode,
            cardTypeCode = currentCard.cardTypeCode,
            easeFactor = newEaseFactor,
            intervalDays = newIntervalDays,
            repetitions = newRepetitions,
            nextReviewDate = nextReviewDate,
            lastReviewedAt = now,
            createdAt = currentCard.createdAt,
            updatedAt = currentCard.updatedAt,
            createdBy = currentCard.createdBy,
            updatedBy = currentCard.updatedBy,
        )
    }

    /**
     * Creates initial card with default SM-2 values.
     *
     * @param accountId Account ID
     * @param knowledgeCode Knowledge code
     * @param cardTypeCode Card type code
     * @return New AccountCard with default SM-2 values
     */
    fun createInitialCard(
        accountId: Long,
        knowledgeCode: String,
        cardTypeCode: String,
    ): AccountCard {
        val now = LocalDateTime.now()
        return AccountCard(
            id = null,
            accountId = accountId,
            knowledgeCode = knowledgeCode,
            cardTypeCode = cardTypeCode,
            easeFactor = BigDecimal(DEFAULT_EASE_FACTOR),
            intervalDays = DEFAULT_INTERVAL_DAYS,
            repetitions = DEFAULT_REPETITIONS,
            nextReviewDate = now,
            lastReviewedAt = null,
            createdAt = java.time.Instant.now(),
            updatedAt = java.time.Instant.now(),
            createdBy = null,
            updatedBy = null,
        )
    }

    /**
     * Calculates new ease factor based on quality rating.
     * Formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
     * Minimum ease factor: 1.3
     */
    private fun calculateNewEaseFactor(
        currentEaseFactor: BigDecimal,
        quality: Int,
    ): BigDecimal {
        val q = quality.toDouble()
        val ef = currentEaseFactor.toDouble()

        // SM-2 ease factor formula
        val adjustment = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
        val newEf = ef + adjustment

        // Ensure minimum ease factor
        val finalEf = maxOf(newEf, MIN_EASE_FACTOR)

        return BigDecimal(finalEf).setScale(2, java.math.RoundingMode.HALF_UP)
    }

    /**
     * Calculates new interval in days based on repetitions and ease factor.
     * SM-2 Algorithm interval calculation:
     * - If repetitions = 1: interval = 1 day
     * - If repetitions = 2: interval = 6 days
     * - If repetitions > 2: interval = previous_interval * ease_factor
     *
     * Since we're calculating from current card state, we use current interval_days as previous interval.
     */
    private fun calculateNewInterval(
        repetitions: Int,
        easeFactor: BigDecimal,
        currentIntervalDays: Int,
    ): Int =
        when (repetitions) {
            1 -> 1
            2 -> 6
            else -> {
                // For repetitions > 2, multiply previous interval by ease factor
                val calculated = currentIntervalDays * easeFactor.toDouble()
                maxOf(calculated.toInt(), 1)
            }
        }
}
