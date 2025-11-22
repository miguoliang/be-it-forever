package com.miguoliang.englishlearning.repository

import com.miguoliang.englishlearning.model.Template
import org.springframework.data.repository.reactive.ReactiveCrudRepository
import org.springframework.stereotype.Repository
import reactor.core.publisher.Mono

@Repository
interface TemplateRepository : ReactiveCrudRepository<Template, String> {
    fun findByCode(code: String): Mono<Template>

    fun findByName(name: String): Mono<Template>
}
