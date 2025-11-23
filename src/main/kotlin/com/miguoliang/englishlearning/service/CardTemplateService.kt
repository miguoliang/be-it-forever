package com.miguoliang.englishlearning.service

import com.miguoliang.englishlearning.model.CardType
import com.miguoliang.englishlearning.model.Knowledge
import com.miguoliang.englishlearning.model.Template
import com.miguoliang.englishlearning.repository.CardTypeTemplateRelRepository
import com.miguoliang.englishlearning.repository.KnowledgeRelRepository
import com.miguoliang.englishlearning.repository.KnowledgeRepository
import com.miguoliang.englishlearning.template.CardRenderData
import com.miguoliang.englishlearning.template.MetadataTemplateData
import com.miguoliang.englishlearning.template.RelatedKnowledgeTemplateData
import io.quarkus.qute.Engine
import io.smallrye.mutiny.Uni
import io.smallrye.mutiny.coroutines.awaitSuspending
import jakarta.inject.Singleton
import java.nio.charset.StandardCharsets
import java.util.concurrent.ConcurrentHashMap
import io.quarkus.qute.Template as QuteTemplate

/**
 * Renders card templates with knowledge data using Qute reactive template engine.
 * Loads templates from database via TemplateService and card_type_template_rel.
 * Uses Qute syntax: `{name}`, `{description}`, `{metadata.level}`,
 * `{#for item in relatedKnowledge}{item.name}{/for}` (iterates over referenced knowledge entities via knowledge_rel).
 * Metadata can be accessed via dot notation (e.g., `{metadata.level}` or `{metadata.nested.key}`).
 * Template format field value is `qute` for Qute templates.
 *
 * Performance: Parsed templates are cached in memory to avoid re-parsing on every render.
 */
@Singleton
class CardTemplateService(
    private val templateService: TemplateService,
    private val cardTypeTemplateRelRepository: CardTypeTemplateRelRepository,
    private val knowledgeRelRepository: KnowledgeRelRepository,
    private val knowledgeRepository: KnowledgeRepository,
    private val quteEngine: Engine,
) {
    // Cache for parsed Qute templates - keyed by template code
    // ConcurrentHashMap provides thread-safe caching without blocking
    private val templateCache = ConcurrentHashMap<String, QuteTemplate>()

    /**
     * Generates content using Qute template for specified role.
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
        if (template.format != "qute") {
            throw IllegalArgumentException(
                "Unsupported template format: ${template.format}. Expected 'qute' for Qute templates.",
            )
        }

        // Load related knowledge items
        val relatedKnowledge = loadRelatedKnowledge(knowledge.code)

        // Render template using Qute (fully reactive)
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
     * Renders Qute template with knowledge data reactively.
     * No blocking I/O - fully async/await compatible.
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
    ): String =
        try {
            // Get or parse template (with caching for performance)
            val quteTemplate =
                templateCache.computeIfAbsent(template.code) {
                    val templateContent = String(template.content, StandardCharsets.UTF_8)
                    // Parse template once and cache it
                    quteEngine.parse(templateContent)
                }

            // Prepare data model for Qute
            val dataModel = prepareDataModel(knowledge, relatedKnowledge)

            // Render template reactively: CompletionStage -> Uni -> awaitSuspending
            val completionStage = quteTemplate.data(dataModel).renderAsync()
            Uni.createFrom().completionStage(completionStage).awaitSuspending()
        } catch (e: io.quarkus.qute.TemplateException) {
            throw RuntimeException("Qute template error in template ${template.code}: ${e.message}", e)
        } catch (e: Exception) {
            throw RuntimeException("Failed to render Qute template: ${template.code}", e)
        }

    /**
     * Clears the template cache.
     * Call this when templates are updated in the database.
     */
    fun clearCache() {
        templateCache.clear()
    }

    /**
     * Removes a specific template from cache.
     * Call this when a template is updated in the database.
     */
    fun evictTemplate(templateCode: String) {
        templateCache.remove(templateCode)
    }

    /**
     * Prepares type-safe data model for Qute template.
     * Converts Knowledge entities to type-safe template data classes.
     * Using type-safe classes provides compile-time checking and IDE auto-completion.
     */
    private fun prepareDataModel(
        knowledge: Knowledge,
        relatedKnowledge: List<Knowledge>,
    ): CardRenderData {
        // Convert metadata to template data
        val metadataData =
            knowledge.metadata?.let {
                MetadataTemplateData(level = it.level)
            } ?: MetadataTemplateData(level = null)

        // Convert related knowledge to template data list
        val relatedKnowledgeData =
            relatedKnowledge.map { related ->
                RelatedKnowledgeTemplateData(
                    code = related.code,
                    name = related.name,
                    description = related.description ?: "",
                    metadata =
                        related.metadata?.let {
                            MetadataTemplateData(level = it.level)
                        } ?: MetadataTemplateData(level = null),
                )
            }

        // Return type-safe CardRenderData
        return CardRenderData(
            name = knowledge.name,
            description = knowledge.description ?: "",
            code = knowledge.code,
            metadata = metadataData,
            relatedKnowledge = relatedKnowledgeData,
        )
    }
}
