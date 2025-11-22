package com.miguoliang.englishlearning.dto

import com.fasterxml.jackson.annotation.JsonProperty

/**
 * DTO for Statistics API responses.
 */
data class StatsDto(
    @JsonProperty("totalCards")
    val totalCards: Long,
    @JsonProperty("newCards")
    val newCards: Long,
    @JsonProperty("learningCards")
    val learningCards: Long,
    @JsonProperty("dueToday")
    val dueToday: Long,
    @JsonProperty("byCardType")
    val byCardType: Map<String, Long>,
)
