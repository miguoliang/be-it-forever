package com.miguoliang.englishlearning.service

import kotlinx.coroutines.reactor.awaitSingle
import org.springframework.r2dbc.core.DatabaseClient
import org.springframework.stereotype.Service

@Service
class CodeGenerationService(
    private val databaseClient: DatabaseClient,
) {
    suspend fun generateCode(prefix: String): String {
        require(prefix in listOf("ST", "CS")) { "Invalid prefix: $prefix. Must be ST or CS" }
        require(prefix.length == 2) { "Prefix must be exactly 2 characters" }

        val sequenceName = "code_seq_${prefix.lowercase()}"

        val nextValue =
            databaseClient
                .sql("SELECT nextval(:sequenceName)")
                .bind("sequenceName", sequenceName)
                .map { row ->
                    row.get("nextval", Long::class.java) ?: throw IllegalStateException("Sequence returned null")
                }.one()
                .awaitSingle()

        val number = nextValue.toString().padStart(7, '0')
        require(number.length <= 7) { "Sequence value exceeds 7 digits" }

        val code = "$prefix-$number"
        require(code.length == 10) { "Generated code must be exactly 10 characters" }

        return code
    }

    fun validateCode(code: String): Boolean {
        val pattern = Regex("^(ST|CS)-\\d{7}$")
        return pattern.matches(code) && code.length == 10
    }
}
