package com.miguoliang.englishlearning.dto

import com.fasterxml.jackson.annotation.JsonProperty
import java.time.Instant

/**
 * Response DTO for workflow cancellation.
 */
data class WorkflowCancelResponseDto(
    @JsonProperty("workflowId")
    val workflowId: String,
    val canceled: Boolean,
    val timestamp: Instant,
)
