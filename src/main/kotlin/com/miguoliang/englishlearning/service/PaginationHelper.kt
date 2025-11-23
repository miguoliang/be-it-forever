package com.miguoliang.englishlearning.service

import com.miguoliang.englishlearning.common.Page
import com.miguoliang.englishlearning.common.Pageable
import jakarta.enterprise.context.ApplicationScoped

/**
 * Reusable utility service that encapsulates pagination pattern.
 * Provides paginate() method that combines List<T> data and Long count into Page<T>.
 * Used by all services that need pagination to eliminate boilerplate code.
 */
@ApplicationScoped
class PaginationHelper {
    /**
     * Paginates data from List and count into a Page.
     *
     * @param data The List containing the paginated data
     * @param count The total count
     * @param pageable The pagination parameters
     * @return Page with the data and pagination info
     */
    fun <T : Any> paginate(
        data: List<T>,
        count: Long,
        pageable: Pageable,
    ): Page<T> =
        Page(
            content = data,
            number = pageable.page,
            size = pageable.size,
            totalElements = count,
        )
}
