package com.miguoliang.englishlearning.service

import com.miguoliang.englishlearning.model.Template
import com.miguoliang.englishlearning.repository.TemplateRepository
import org.springframework.stereotype.Service
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

/**
 * Manages template operations.
 */
@Service
class TemplateService(
    private val templateRepository: TemplateRepository,
) {
    /**
     * Get single template by code.
     * 
     * @param code Template code identifier
     * @return Mono containing Template or empty if not found
     */
    fun getTemplateByCode(code: String): Mono<Template> = templateRepository.findByCode(code)

    /**
     * List all templates.
     * Usage determined by relationships (card_type_template_rel).
     * 
     * @return Flux of all templates
     */
    fun getAllTemplates(): Flux<Template> = templateRepository.findAll()
}
