package com.miguoliang.englishlearning.dto

/**
 * DTO for Knowledge API responses.
 */
data class KnowledgeDto(
    val code: String,
    val name: String,
    val description: String?,
    val metadata: Map<String, Any>?,
)

/**
 * Converts Knowledge entity to DTO.
 */
fun com.miguoliang.englishlearning.model.Knowledge.toDto(): KnowledgeDto =
    KnowledgeDto(
        code = this.code,
        name = this.name,
        description = this.description,
        metadata =
            this.metadata?.let { metadata ->
                buildMap {
                    metadata.level?.let { put("level", it) }
                }
            },
    )
