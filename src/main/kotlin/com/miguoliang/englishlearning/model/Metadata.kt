package com.miguoliang.englishlearning.model

import com.fasterxml.jackson.annotation.JsonProperty

/**
 * Metadata for knowledge items.
 * Currently only supports level field.
 */
data class Metadata(
    @JsonProperty("level")
    val level: String? = null,
)
