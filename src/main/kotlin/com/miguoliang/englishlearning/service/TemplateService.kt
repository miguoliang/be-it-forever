package com.miguoliang.englishlearning.service

import com.miguoliang.englishlearning.model.Template
import com.miguoliang.englishlearning.repository.TemplateRepository
import jakarta.inject.Singleton

/**
 * Manages template operations.
 */
@Singleton
class TemplateService(
    private val templateRepository: TemplateRepository,
) {
    /**
     * Get single template by code.
     *
     * @param code Template code identifier
     * @return Template or null if not found
     */
    suspend fun getTemplateByCode(code: String): Template? = templateRepository.findByCode(code)

    /**
     * List all templates.
     * Usage determined by relationships (card_type_template_rel).
     *
     * @return List of all templates
     */
    suspend fun getAllTemplates(): List<Template> = templateRepository.streamAll()
}
