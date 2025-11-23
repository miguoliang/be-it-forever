package com.miguoliang.englishlearning.repository

import com.miguoliang.englishlearning.model.CardType
import io.quarkus.hibernate.reactive.panache.PanacheRepositoryBase
import io.quarkus.panache.common.Parameters
import io.smallrye.mutiny.coroutines.awaitSuspending
import jakarta.enterprise.context.ApplicationScoped

@ApplicationScoped
class CardTypeRepository : PanacheRepositoryBase<CardType, String> {
    suspend fun streamAll(): List<CardType> = findAll().list<CardType>().awaitSuspending()

    suspend fun findByCode(code: String): CardType? = findById(code).awaitSuspending()

    suspend fun findByName(name: String): CardType? =
        find("name = :name", Parameters.with("name", name))
            .firstResult<CardType>()
            .awaitSuspending()

    suspend fun findByCodeIn(codes: Collection<String>): List<CardType> =
        find("code in :codes", Parameters.with("codes", codes))
            .list<CardType>()
            .awaitSuspending()
}
