package com.miguoliang.englishlearning.dto

import com.fasterxml.jackson.annotation.JsonProperty
import java.time.Instant

/**
 * DTO for workflow execution creation responses.
 */
data class WorkflowExecutionDto(
    @JsonProperty("workflowId")
    val workflowId: String,
    @JsonProperty("workflowExecutionId")
    val workflowExecutionId: String,
    @JsonProperty("runId")
    val runId: String,
    val status: String,
    @JsonProperty("startedAt")
    val startedAt: Instant,
)
