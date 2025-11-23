package com.miguoliang.englishlearning.service

import com.miguoliang.englishlearning.model.CardType
import com.miguoliang.englishlearning.model.Knowledge
import com.miguoliang.englishlearning.model.Template
import com.miguoliang.englishlearning.repository.CardTypeTemplateRelRepository
import com.miguoliang.englishlearning.repository.KnowledgeRelRepository
import com.miguoliang.englishlearning.repository.KnowledgeRepository
import freemarker.template.Configuration
import jakarta.enterprise.context.ApplicationScoped
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.StringWriter
import java.nio.charset.StandardCharsets
import java.util.UUID

/**
 * Renders card templates with knowledge data using FreeMarker template engine.
 * Loads templates from database via TemplateService and card_type_template_rel.
 * Uses FreeMarker Template Language (FTL) syntax: `${name}`, `${description}`, `${metadata.level}`,
 * `<#list relatedKnowledge as item>...${item.name}...</#list>` (iterates over referenced knowledge entities via knowledge_rel).
 * Metadata can be accessed via dot notation (e.g., `${metadata.key}` or `${metadata.nested.key}`).
 * Template format field value is `ftl` for FreeMarker templates.
 */
@ApplicationScoped
class CardTemplateService(
    private val templateService: TemplateService,
    private val cardTypeTemplateRelRepository: CardTypeTemplateRelRepository,
    private val knowledgeRelRepository: KnowledgeRelRepository,
    private val knowledgeRepository: KnowledgeRepository,
    private val freeMarkerConfig: Configuration,
) {
    /**
     * Generates content using FreeMarker template for specified role.
     *
     * @param cardType Card type
     * @param knowledge Knowledge item to render
     * @param role Template role (e.g., "front", "back")
     * @return rendered content string, or empty string if template not found
     */
    suspend fun renderByRole(
        cardType: CardType,
        knowledge: Knowledge,
        role: String,
    ): String {
        // Find template for this card type and role
        val rel =
            cardTypeTemplateRelRepository.findByCardTypeCodeAndRole(cardType.code, role)
                ?: throw com.miguoliang.englishlearning.exception.TemplateNotFoundException(
                    "No template mapping found for cardType=${cardType.code}, role=$role",
                )

        val template =
            templateService.getTemplateByCode(rel.templateCode)
                ?: throw com.miguoliang.englishlearning.exception.TemplateNotFoundException(
                    "Template not found: ${rel.templateCode}",
                )

        // Validate template format
        if (template.format != "ftl") {
            throw IllegalArgumentException(
                "Unsupported template format: ${template.format}. Expected 'ftl' for FreeMarker.",
            )
        }

        // Load related knowledge items
        val relatedKnowledge = loadRelatedKnowledge(knowledge.code)

        // Render template using FreeMarker
        return renderTemplate(template, knowledge, relatedKnowledge)
    }

    /**
     * Loads related knowledge items via knowledge_rel junction table.
     * Uses batch loading to avoid N+1 queries.
     */
    private suspend fun loadRelatedKnowledge(knowledgeCode: String): List<Knowledge> {
        val rels = knowledgeRelRepository.findBySourceKnowledgeCode(knowledgeCode)
        val targetCodes = rels.map { it.targetKnowledgeCode }

        return if (targetCodes.isEmpty()) {
            emptyList()
        } else {
            // Batch load all related knowledge in a single query
            knowledgeRepository.findByCodeIn(targetCodes)
        }
    }

    /**
     * Renders FreeMarker template with knowledge data.
     *
     * @param template Template entity from database
     * @param knowledge Knowledge item to render
     * @param relatedKnowledge List of related knowledge items
     * @return rendered content string
     */
    private suspend fun renderTemplate(
        template: Template,
        knowledge: Knowledge,
        relatedKnowledge: List<Knowledge>,
    ): String {
        // Execute FreeMarker rendering on IO dispatcher to avoid blocking
        return withContext(Dispatchers.IO) {
            try {
                val templateContent = String(template.content, StandardCharsets.UTF_8)

                // Register template with FreeMarker StringTemplateLoader
                // Use unique name per request to avoid conflicts in concurrent scenarios
                val templateLoader =
                    freeMarkerConfig.templateLoader as
                        freemarker.cache.StringTemplateLoader
                val templateName = "template_${template.code}_${UUID.randomUUID()}"

                templateLoader.putTemplate(templateName, templateContent)

                // Get FreeMarker template
                val fmTemplate = freeMarkerConfig.getTemplate(templateName)

                // Prepare data model for FreeMarker
                val dataModel = prepareDataModel(knowledge, relatedKnowledge)

                // Render template
                val writer = StringWriter()
                fmTemplate.process(dataModel, writer)

                writer.toString()
            } catch (e: freemarker.template.TemplateException) {
                throw RuntimeException("FreeMarker template error in template ${template.code}: ${e.message}", e)
            } catch (e: java.io.IOException) {
                throw RuntimeException("IO error rendering template ${template.code}: ${e.message}", e)
            } catch (e: Exception) {
                throw RuntimeException("Failed to render FreeMarker template: ${template.code}", e)
            }
        }
    }

    /**
     * Prepares data model for FreeMarker template.
     * Converts Knowledge entities and metadata to FreeMarker-compatible data structures.
     */
    private fun prepareDataModel(
        knowledge: Knowledge,
        relatedKnowledge: List<Knowledge>,
    ): Map<String, Any> =
        buildMap {
            // Add main knowledge fields
            put("name", knowledge.name)
            put("description", knowledge.description ?: "")
            put("code", knowledge.code)

            // Add metadata as nested map for dot notation access
            put("metadata", knowledge.metadata?.let { convertMetadataToMap(it) } ?: emptyMap<String, Any>())

            // Add related knowledge list for iteration
            val relatedKnowledgeList =
                relatedKnowledge.map { related ->
                    mapOf(
                        "code" to related.code,
                        "name" to related.name,
                        "description" to (related.description ?: ""),
                        "metadata" to (related.metadata?.let { convertMetadataToMap(it) } ?: emptyMap<String, Any>()),
                    )
                }
            put("relatedKnowledge", relatedKnowledgeList)
        }

    /**
     * Converts Metadata object to Map for FreeMarker dot notation access.
     */
    private fun convertMetadataToMap(metadata: com.miguoliang.englishlearning.model.Metadata): Map<String, Any> =
        buildMap {
            metadata.level?.let { put("level", it) }
        }
}
