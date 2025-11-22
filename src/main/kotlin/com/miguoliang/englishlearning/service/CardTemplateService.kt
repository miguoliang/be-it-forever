package com.miguoliang.englishlearning.service

import com.miguoliang.englishlearning.model.CardType
import com.miguoliang.englishlearning.model.Knowledge
import com.miguoliang.englishlearning.model.Template
import com.miguoliang.englishlearning.repository.CardTypeTemplateRelRepository
import com.miguoliang.englishlearning.repository.KnowledgeRelRepository
import com.miguoliang.englishlearning.repository.KnowledgeRepository
import freemarker.template.Configuration
import org.springframework.stereotype.Service
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
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
@Service
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
     * @return Mono containing rendered content string
     */
    fun renderByRole(
        cardType: CardType,
        knowledge: Knowledge,
        role: String,
    ): Mono<String> {
        // Find template for this card type and role
        return cardTypeTemplateRelRepository
            .findByCardTypeCodeAndRole(cardType.code, role)
            .flatMap { rel ->
                templateService.getTemplateByCode(rel.templateCode)
            }.flatMap { template ->
                // Validate template format
                if (template.format != "ftl") {
                    return@flatMap Mono.error<String>(
                        IllegalArgumentException(
                            "Unsupported template format: ${template.format}. Expected 'ftl' for FreeMarker.",
                        ),
                    )
                }

                // Load related knowledge items
                loadRelatedKnowledge(knowledge.code)
                    .collectList()
                    .flatMap { relatedKnowledge ->
                        // Render template using FreeMarker
                        renderTemplate(template, knowledge, relatedKnowledge)
                    }
            }.switchIfEmpty(Mono.just(""))
    }

    /**
     * Loads related knowledge items via knowledge_rel junction table.
     * Uses batch loading to avoid N+1 queries.
     */
    private fun loadRelatedKnowledge(knowledgeCode: String): Flux<Knowledge> =
        knowledgeRelRepository
            .findBySourceKnowledgeCode(knowledgeCode)
            .map { it.targetKnowledgeCode }
            .collectList()
            .flatMapMany { targetCodes ->
                if (targetCodes.isEmpty()) {
                    Flux.empty()
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
     * @return Mono containing rendered content string
     */
    private fun renderTemplate(
        template: Template,
        knowledge: Knowledge,
        relatedKnowledge: List<Knowledge>,
    ): Mono<String> =
        Mono
            .fromCallable<String> {
                try {
                    val templateContent = String(template.content, StandardCharsets.UTF_8)

                    // Register template with FreeMarker StringTemplateLoader
                    // Use unique name per request to avoid conflicts in concurrent scenarios
                    val templateLoader =
                        freeMarkerConfig.templateLoader as
                            com.miguoliang.englishlearning.config.StringTemplateLoader
                    val templateName = "template_${template.code}_${UUID.randomUUID()}"

                    try {
                        templateLoader.putTemplate(templateName, templateContent)

                        // Get FreeMarker template
                        val fmTemplate = freeMarkerConfig.getTemplate(templateName)

                        // Prepare data model for FreeMarker
                        val dataModel = prepareDataModel(knowledge, relatedKnowledge)

                        // Render template
                        val writer = StringWriter()
                        fmTemplate.process(dataModel, writer)

                        writer.toString()
                    } finally {
                        // Always clean up template from loader
                        templateLoader.clearTemplate(templateName)
                    }
                } catch (e: freemarker.template.TemplateException) {
                    throw RuntimeException("FreeMarker template error in template ${template.code}: ${e.message}", e)
                } catch (e: java.io.IOException) {
                    throw RuntimeException("IO error rendering template ${template.code}: ${e.message}", e)
                } catch (e: Exception) {
                    throw RuntimeException("Failed to render FreeMarker template: ${template.code}", e)
                }
            }.subscribeOn(
                reactor.core.scheduler.Schedulers
                    .boundedElastic(),
            )

    /**
     * Prepares data model for FreeMarker template.
     * Converts Knowledge entities and metadata to FreeMarker-compatible data structures.
     */
    private fun prepareDataModel(
        knowledge: Knowledge,
        relatedKnowledge: List<Knowledge>,
    ): Map<String, Any> {
        val dataModel = mutableMapOf<String, Any>()

        // Add main knowledge fields
        dataModel["name"] = knowledge.name
        dataModel["description"] = knowledge.description ?: ""
        dataModel["code"] = knowledge.code

        // Add metadata as nested map for dot notation access
        if (knowledge.metadata != null) {
            val metadataMap = convertMetadataToMap(knowledge.metadata)
            dataModel["metadata"] = metadataMap
        } else {
            dataModel["metadata"] = emptyMap<String, Any>()
        }

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
        dataModel["relatedKnowledge"] = relatedKnowledgeList

        return dataModel
    }

    /**
     * Converts Metadata object to Map for FreeMarker dot notation access.
     */
    private fun convertMetadataToMap(metadata: com.miguoliang.englishlearning.model.Metadata): Map<String, Any> {
        val map = mutableMapOf<String, Any>()
        metadata.level?.let { map["level"] = it }
        // Add more metadata fields as they are added to Metadata class
        return map
    }
}
