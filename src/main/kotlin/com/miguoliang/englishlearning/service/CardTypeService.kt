package com.miguoliang.englishlearning.service

import com.miguoliang.englishlearning.common.Page
import com.miguoliang.englishlearning.common.Pageable
import com.miguoliang.englishlearning.model.CardType
import com.miguoliang.englishlearning.repository.CardTypeRepository
import io.smallrye.mutiny.coroutines.awaitSuspending
import jakarta.inject.Singleton

/**
 * Manages card type operations.
 */
@Singleton
class CardTypeService(
    private val cardTypeRepository: CardTypeRepository,
    private val paginationHelper: PaginationHelper,
) {
    /**
     * Get card types with proper database-level pagination.
     * Recommended for production use to avoid loading all records into memory.
     *
     * @param pageable Pagination parameters
     * @return Page of card types
     */
    suspend fun getCardTypes(pageable: Pageable): Page<CardType> {
        val data = cardTypeRepository.findAllPaginated(pageable)
        val count = cardTypeRepository.count().awaitSuspending()
        return paginationHelper.paginate(data, count, pageable)
    }

    /**
     * List all card types (use with caution - only for small datasets).
     * This method loads ALL records into memory.
     * For production use, prefer getCardTypes(pageable) with pagination.
     *
     * Note: Template references are not loaded here. Use CardTemplateService to render templates for specific roles.
     *
     * @return List of all card types
     * @throws IllegalStateException if attempting to load more than 1000 records
     */
    suspend fun getAllCardTypes(): List<CardType> = cardTypeRepository.streamAll()

    /**
     * Get single card type by code.
     * Note: Template references are not loaded here. Use CardTemplateService to render templates for specific roles.
     *
     * @param code Card type code identifier
     * @return CardType or null if not found
     */
    suspend fun getCardTypeByCode(code: String): CardType? = cardTypeRepository.findByCode(code)

    /**
     * Batch load card types by codes.
     *
     * @param codes Collection of card type codes
     * @return Map of code to CardType
     */
    suspend fun getCardTypesByCodes(codes: Collection<String>): Map<String, CardType> =
        if (codes.isEmpty()) {
            emptyMap()
        } else {
            cardTypeRepository
                .findByCodeIn(codes)
                .associateBy { cardType -> cardType.code }
        }
}
