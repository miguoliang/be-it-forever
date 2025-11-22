package com.miguoliang.englishlearning.dto

import com.fasterxml.jackson.annotation.JsonProperty
import java.time.Instant

/**
 * DTO for workflow status responses.
 */
data class WorkflowStatusDto(
    @JsonProperty("workflowId")
    val workflowId: String,
    @JsonProperty("workflowType")
    val workflowType: String,
    val status: String,
    @JsonProperty("startedAt")
    val startedAt: Instant?,
    @JsonProperty("completedAt")
    val completedAt: Instant?,
    val result: Map<String, Any>? = null,
    val error: String? = null,
)
