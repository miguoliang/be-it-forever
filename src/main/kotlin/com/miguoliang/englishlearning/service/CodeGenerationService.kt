package com.miguoliang.englishlearning.service

import io.smallrye.mutiny.coroutines.awaitSuspending
import io.vertx.mutiny.sqlclient.Pool
import jakarta.enterprise.context.ApplicationScoped

@ApplicationScoped
class CodeGenerationService(
    private val pool: Pool,
) {
    suspend fun generateCode(prefix: String): String {
        require(prefix in listOf("ST", "CS")) { "Invalid prefix: $prefix. Must be ST or CS" }
        require(prefix.length == 2) { "Prefix must be exactly 2 characters" }

        val sequenceName = "code_seq_${prefix.lowercase()}"

        val rowSet =
            pool
                .query("SELECT nextval('$sequenceName')")
                .execute()
                .awaitSuspending()

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
