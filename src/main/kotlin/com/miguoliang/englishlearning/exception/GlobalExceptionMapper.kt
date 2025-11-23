package com.miguoliang.englishlearning.exception

import com.miguoliang.englishlearning.dto.ErrorResponseFactory
import jakarta.ws.rs.core.Response
import jakarta.ws.rs.ext.ExceptionMapper
import jakarta.ws.rs.ext.Provider
import org.jboss.logging.Logger

/**
 * Global exception mapper that converts exceptions to proper HTTP responses.
 * This eliminates the need for try-catch blocks in every controller method.
 */
@Provider
class GlobalExceptionMapper : ExceptionMapper<Exception> {
    companion object {
        private val log = Logger.getLogger(GlobalExceptionMapper::class.java)
    }

    override fun toResponse(exception: Exception): Response =
        when (exception) {
            is NotFoundException -> {
                log.debugf("Resource not found: %s/%s", exception.resource, exception.resourceId)
                Response
                    .status(Response.Status.NOT_FOUND)
                    .entity(ErrorResponseFactory.notFound(exception.resource, exception.resourceId))
                    .build()
            }

            is BadRequestException -> {
                log.debugf("Bad request: %s", exception.message)
                Response
                    .status(Response.Status.BAD_REQUEST)
                    .entity(ErrorResponseFactory.badRequest(exception.message ?: "Bad request", exception.details))
                    .build()
            }

            is ForbiddenException -> {
                log.debugf("Forbidden: %s", exception.message)
                Response
                    .status(Response.Status.FORBIDDEN)
                    .entity(ErrorResponseFactory.forbidden(exception.message ?: "Access forbidden"))
                    .build()
            }

            is UnauthorizedException -> {
                log.debugf("Unauthorized: %s", exception.message)
                Response
                    .status(Response.Status.UNAUTHORIZED)
                    .entity(ErrorResponseFactory.unauthorized(exception.message ?: "Unauthorized"))
                    .build()
            }

            is ConflictException -> {
                log.debugf("Conflict: %s", exception.message)
                Response
                    .status(Response.Status.CONFLICT)
                    .entity(ErrorResponseFactory.internalError(exception.message ?: "Conflict"))
                    .build()
            }

            is TemplateNotFoundException -> {
                log.warnf("Template not found: %s", exception.message)
                Response
                    .status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(ErrorResponseFactory.internalError(exception.message ?: "Template not found"))
                    .build()
            }

            is IllegalArgumentException -> {
                log.debugf("Invalid argument: %s", exception.message)
                Response
                    .status(Response.Status.BAD_REQUEST)
                    .entity(ErrorResponseFactory.badRequest(exception.message ?: "Invalid argument"))
                    .build()
            }

            is IllegalStateException -> {
                log.warnf("Invalid state: %s", exception.message)
                Response
                    .status(Response.Status.CONFLICT)
                    .entity(ErrorResponseFactory.internalError(exception.message ?: "Invalid state"))
                    .build()
            }

            is NoSuchElementException -> {
                log.debugf("Element not found: %s", exception.message)
                Response
                    .status(Response.Status.NOT_FOUND)
                    .entity(ErrorResponseFactory.notFound("Resource", "unknown"))
                    .build()
            }

            else -> {
                log.errorf(exception, "Unexpected error: %s", exception.message)
                Response
                    .status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(
                        ErrorResponseFactory.internalError(
                            exception.message ?: "An unexpected error occurred",
                        ),
                    ).build()
            }
        }
}
