package com.miguoliang.englishlearning.service

import com.miguoliang.englishlearning.model.CardType
import com.miguoliang.englishlearning.repository.CardTypeRepository
import org.springframework.stereotype.Service
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

/**
 * Manages card type operations.
 */
@Service
class CardTypeService(
    private val cardTypeRepository: CardTypeRepository,
) {
    /**
     * List all card types.
     * Note: Template references are not loaded here. Use CardTemplateService to render templates for specific roles.
     * 
     * @return Flux of all card types
     */
    fun getAllCardTypes(): Flux<CardType> = cardTypeRepository.findAll()

    /**
     * Get single card type by code.
     * Note: Template references are not loaded here. Use CardTemplateService to render templates for specific roles.
     *
     * @param code Card type code identifier
     * @return Mono containing CardType or empty if not found
     */
    fun getCardTypeByCode(code: String): Mono<CardType> = cardTypeRepository.findByCode(code)

    /**
     * Batch load card types by codes.
     *
     * @param codes Collection of card type codes
     * @return Mono containing Map of code to CardType
     */
    fun getCardTypesByCodes(codes: Collection<String>): Mono<Map<String, CardType>> {
        if (codes.isEmpty()) {
            return Mono.just(emptyMap())
        }
        return cardTypeRepository
            .findByCodeIn(codes)
            .collectMap { it.code }
    }
}
