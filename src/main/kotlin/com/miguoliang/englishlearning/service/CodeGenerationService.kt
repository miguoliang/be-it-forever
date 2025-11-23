package com.miguoliang.englishlearning.service

import io.smallrye.mutiny.coroutines.awaitSuspending
import io.vertx.mutiny.sqlclient.Pool
import jakarta.inject.Singleton

@Singleton
class CodeGenerationService(
    private val pool: Pool,
) {
    suspend fun generateCode(prefix: String): String {
        require(prefix in listOf("ST", "CS")) { "Invalid prefix: $prefix. Must be ST or CS" }
        require(prefix.length == 2) { "Prefix must be exactly 2 characters" }

        // Use explicit sequence names to avoid SQL injection - no string interpolation in SQL
        val sequenceName =
            when (prefix.uppercase()) {
                "ST" -> "code_seq_st"
                "CS" -> "code_seq_cs"
                else -> throw IllegalArgumentException("Invalid prefix: $prefix")
            }

        // Use parameterized query to prevent SQL injection
        val rowSet =
            pool
                .preparedQuery("SELECT nextval($1)")
                .execute(
                    io.vertx.mutiny.sqlclient.Tuple
                        .of(sequenceName),
                ).awaitSuspending()

        val row = rowSet.iterator().next()
        val nextValue = row.getLong(0)

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
