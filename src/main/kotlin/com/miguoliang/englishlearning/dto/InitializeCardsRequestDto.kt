package com.miguoliang.englishlearning.dto

/**
 * Request DTO for card initialization.
 */
data class InitializeCardsRequestDto(
    val cardTypeCodes: List<String>? = null,
)
