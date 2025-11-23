package com.miguoliang.englishlearning.common

data class Page<T>(
    val content: List<T>,
    val number: Int,
    val size: Int,
    val totalElements: Long,
) {
    val totalPages: Int = if (size > 0) ((totalElements + size - 1) / size).toInt() else 0
}

data class Pageable(
    val page: Int,
    val size: Int,
) {
    val offset: Long = (page * size).toLong()
}

object PageRequest {
    fun of(
        page: Int,
        size: Int,
    ): Pageable = Pageable(page, size)
}
