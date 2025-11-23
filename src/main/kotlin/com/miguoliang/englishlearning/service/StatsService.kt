package com.miguoliang.englishlearning.service

import com.miguoliang.englishlearning.dto.StatsDto
import com.miguoliang.englishlearning.repository.AccountCardRepository
import jakarta.enterprise.context.ApplicationScoped
import java.time.LocalDateTime

/**
 * Calculates account statistics.
 */
@ApplicationScoped
class StatsService(
    private val accountCardRepository: AccountCardRepository,
) {
    /**
     * Get comprehensive learning statistics for an account.
     * Uses database aggregation for efficiency instead of loading all cards into memory.
     *
     * @param accountId Account ID
     * @return StatsDto with statistics
     */
    suspend fun getStats(accountId: Long): StatsDto {
        val now = LocalDateTime.now()

        // Use database aggregation for efficient statistics computation
        val stats = accountCardRepository.getStatsByAccountId(accountId, now)
        val byCardType = accountCardRepository.getCardTypeStatsByAccountId(accountId)

        return StatsDto(
            totalCards = stats["total"] ?: 0L,
            newCards = stats["new"] ?: 0L,
            learningCards = stats["learning"] ?: 0L,
            dueToday = stats["dueToday"] ?: 0L,
            byCardType = byCardType,
        )
    }
}
