package com.miguoliang.englishlearning.template

import io.quarkus.qute.TemplateData

// Type-safe data classes for Qute templates.
// These classes provide compile-time checking and auto-completion in templates.
// Using @TemplateData annotation enables Qute to generate type-safe accessors.

/**
 * Main knowledge data for card templates.
 * Can be accessed in templates as: {name}, {description}, {code}, {metadata.level}
 */
@TemplateData
data class KnowledgeTemplateData(
    val name: String,
    val description: String,
    val code: String,
    val metadata: MetadataTemplateData,
)

/**
 * Metadata information for knowledge items.
 * Can be accessed in templates as: {metadata.level}
 */
@TemplateData
data class MetadataTemplateData(
    val level: String?,
)

/**
 * Related knowledge item for lists.
 * Can be iterated in templates as: {#for item in relatedKnowledge}{item.name}{/for}
 */
@TemplateData
data class RelatedKnowledgeTemplateData(
    val code: String,
    val name: String,
    val description: String,
    val metadata: MetadataTemplateData,
)

/**
 * Complete data model for card template rendering.
 * This is the root object passed to templates.
 */
@TemplateData
data class CardRenderData(
    val name: String,
    val description: String,
    val code: String,
    val metadata: MetadataTemplateData,
    val relatedKnowledge: List<RelatedKnowledgeTemplateData>,
)
