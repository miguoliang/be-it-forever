package com.miguoliang.englishlearning.service

import com.miguoliang.englishlearning.model.CardType
import com.miguoliang.englishlearning.repository.CardTypeRepository
import jakarta.enterprise.context.ApplicationScoped

/**
 * Manages card type operations.
 */
@ApplicationScoped
class CardTypeService(
    private val cardTypeRepository: CardTypeRepository,
) {
    /**
     * List all card types.
     * Note: Template references are not loaded here. Use CardTemplateService to render templates for specific roles.
     *
     * @return List of all card types
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
