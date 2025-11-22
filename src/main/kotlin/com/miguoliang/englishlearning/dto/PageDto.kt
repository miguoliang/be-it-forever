package com.miguoliang.englishlearning.dto

import com.fasterxml.jackson.annotation.JsonProperty
import org.springframework.data.domain.Page

/**
 * DTO wrapper for Spring Page responses.
 * Provides consistent pagination structure matching API specification.
 */
data class PageDto<T>(
    val content: List<T>,
    val page: PageInfoDto,
)

/**
 * Page information DTO.
 */
data class PageInfoDto(
    val number: Int,
    val size: Int,
    @JsonProperty("totalElements")
    val totalElements: Long,
    @JsonProperty("totalPages")
    val totalPages: Int,
)

/**
 * Converts Spring Page to PageDto.
 */
fun <T : Any> Page<T>.toDto(): PageDto<T> =
    PageDto(
        content = this.content,
        page =
            PageInfoDto(
                number = this.number,
                size = this.size,
                totalElements = this.totalElements,
                totalPages = this.totalPages,
            ),
    )
