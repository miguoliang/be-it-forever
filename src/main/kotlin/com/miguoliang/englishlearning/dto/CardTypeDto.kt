package com.miguoliang.englishlearning.dto

/**
 * DTO for CardType API responses.
 */
data class CardTypeDto(
    val code: String,
    val name: String,
    val description: String?,
)

/**
 * Converts CardType entity to DTO.
 */
fun com.miguoliang.englishlearning.model.CardType.toDto(): CardTypeDto =
    CardTypeDto(
        code = this.code,
        name = this.name,
        description = this.description,
    )
