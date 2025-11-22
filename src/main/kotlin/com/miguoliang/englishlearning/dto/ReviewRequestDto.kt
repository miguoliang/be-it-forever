package com.miguoliang.englishlearning.dto

import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min

/**
 * Request DTO for card review submission.
 */
data class ReviewRequestDto(
    @field:Min(0)
    @field:Max(5)
    val quality: Int,
)
