package com.miguoliang.englishlearning.service

import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

/**
 * Reusable utility service that encapsulates R2DBC pagination pattern.
 * Provides paginate() method that combines Flux<T> data query and Mono<Long> count query into Mono<Page<T>>.
 * Used by all services that need pagination to eliminate boilerplate code.
 */
@Service
class ReactivePaginationHelper {
    /**
     * Paginates data from Flux and count from Mono into a Page.
     *
     * @param data The Flux containing the paginated data
     * @param count The Mono containing the total count
     * @param pageable The pagination parameters
     * @return Mono containing a Page with the data and pagination info
     */
    fun <T : Any> paginate(
        data: Flux<T>,
        count: Mono<Long>,
        pageable: Pageable,
    ): Mono<Page<T>> =
        Mono.zip(data.collectList(), count) { items, total ->
            PageImpl(items, pageable, total)
        }

    /**
     * Paginates data from separate data and count queries.
     * Convenience method that combines dataQuery and countQuery.
     *
     * @param dataQuery The Flux query for paginated data
     * @param countQuery The Mono query for total count
     * @param pageable The pagination parameters
     * @return Mono containing a Page with the data and pagination info
     */
    fun <T : Any> paginateWithQuery(
        dataQuery: Flux<T>,
        countQuery: Mono<Long>,
        pageable: Pageable,
    ): Mono<Page<T>> = paginate(dataQuery, countQuery, pageable)
}
