package com.miguoliang.englishlearning.dto

/**
 * Error response DTO following simplified Google API Design Guidelines format.
 */
data class ErrorResponseDto(
    val error: ErrorDto,
)

/**
 * Error details DTO.
 */
data class ErrorDto(
    val code: String,
    val message: String,
    val details: Map<String, Any>? = null,
)

/**
 * Creates error response for common error scenarios.
 */
object ErrorResponseFactory {
    fun notFound(
        resource: String,
        resourceId: String,
    ): ErrorResponseDto =
        ErrorResponseDto(
            error =
                ErrorDto(
                    code = "NOT_FOUND",
                    message = "$resource not found",
                    details =
                        mapOf(
                            "resource" to resource,
                            "resourceId" to resourceId,
                        ),
                ),
        )

    fun badRequest(
        message: String,
        details: Map<String, Any>? = null,
    ): ErrorResponseDto =
        ErrorResponseDto(
            error =
                ErrorDto(
                    code = "BAD_REQUEST",
                    message = message,
                    details = details,
                ),
        )

    fun forbidden(message: String): ErrorResponseDto =
        ErrorResponseDto(
            error =
                ErrorDto(
                    code = "FORBIDDEN",
                    message = message,
                ),
        )

    fun unauthorized(message: String = "Unauthorized"): ErrorResponseDto =
        ErrorResponseDto(
            error =
                ErrorDto(
                    code = "UNAUTHORIZED",
                    message = message,
                ),
        )

    fun internalError(message: String): ErrorResponseDto =
        ErrorResponseDto(
            error =
                ErrorDto(
                    code = "INTERNAL_ERROR",
                    message = message,
                ),
        )
}
