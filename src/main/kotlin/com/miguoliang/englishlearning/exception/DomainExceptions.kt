package com.miguoliang.englishlearning.exception

/**
 * Base exception for all domain-specific exceptions.
 */
sealed class DomainException(
    message: String,
    cause: Throwable? = null,
) : RuntimeException(message, cause)

/**
 * Thrown when a requested resource is not found.
 */
class NotFoundException(
    val resource: String,
    val resourceId: String,
) : DomainException("$resource not found: $resourceId")

/**
 * Thrown when a request contains invalid data.
 */
class BadRequestException(
    message: String,
    val details: Map<String, Any>? = null,
) : DomainException(message)

/**
 * Thrown when a user is not authorized to access a resource.
 */
class ForbiddenException(
    message: String = "Access forbidden",
) : DomainException(message)

/**
 * Thrown when authentication is required but not provided.
 */
class UnauthorizedException(
    message: String = "Unauthorized",
) : DomainException(message)

/**
 * Thrown when a resource already exists and conflicts with the request.
 */
class ConflictException(
    message: String,
) : DomainException(message)

/**
 * Thrown when template is not found or invalid.
 */
class TemplateNotFoundException(
    message: String,
) : DomainException(message)
