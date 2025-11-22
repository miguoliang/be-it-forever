package com.miguoliang.englishlearning.dto

/**
 * Request DTO for sending workflow signals.
 */
data class WorkflowSignalDto(
    val signalName: String,
    val signalData: Map<String, Any>? = null,
)
