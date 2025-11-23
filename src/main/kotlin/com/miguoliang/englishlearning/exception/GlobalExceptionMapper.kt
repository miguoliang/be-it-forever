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
            is NotFoundException -> handleNotFoundException(exception)
            is BadRequestException -> handleBadRequestException(exception)
            is ForbiddenException -> handleForbiddenException(exception)
            is UnauthorizedException -> handleUnauthorizedException(exception)
            is ConflictException -> handleConflictException(exception)
            is TemplateNotFoundException -> handleTemplateNotFoundException(exception)
            is IllegalArgumentException -> handleIllegalArgumentException(exception)
            is IllegalStateException -> handleIllegalStateException(exception)
            is NoSuchElementException -> handleNoSuchElementException(exception)
            else -> handleUnexpectedException(exception)
        }

    private fun handleNotFoundException(exception: NotFoundException): Response {
        log.debugf("Resource not found: %s/%s", exception.resource, exception.resourceId)
        return Response
            .status(Response.Status.NOT_FOUND)
            .entity(ErrorResponseFactory.notFound(exception.resource, exception.resourceId))
            .build()
    }

    private fun handleBadRequestException(exception: BadRequestException): Response {
        log.debugf("Bad request: %s", exception.message)
        return Response
            .status(Response.Status.BAD_REQUEST)
            .entity(ErrorResponseFactory.badRequest(exception.message ?: "Bad request", exception.details))
            .build()
    }

    private fun handleForbiddenException(exception: ForbiddenException): Response {
        log.debugf("Forbidden: %s", exception.message)
        return Response
            .status(Response.Status.FORBIDDEN)
            .entity(ErrorResponseFactory.forbidden(exception.message ?: "Access forbidden"))
            .build()
    }

    private fun handleUnauthorizedException(exception: UnauthorizedException): Response {
        log.debugf("Unauthorized: %s", exception.message)
        return Response
            .status(Response.Status.UNAUTHORIZED)
            .entity(ErrorResponseFactory.unauthorized(exception.message ?: "Unauthorized"))
            .build()
    }

    private fun handleConflictException(exception: ConflictException): Response {
        log.debugf("Conflict: %s", exception.message)
        return Response
            .status(Response.Status.CONFLICT)
            .entity(ErrorResponseFactory.internalError(exception.message ?: "Conflict"))
            .build()
    }

    private fun handleTemplateNotFoundException(exception: TemplateNotFoundException): Response {
        log.warnf("Template not found: %s", exception.message)
        return Response
            .status(Response.Status.INTERNAL_SERVER_ERROR)
            .entity(ErrorResponseFactory.internalError(exception.message ?: "Template not found"))
            .build()
    }

    private fun handleIllegalArgumentException(exception: IllegalArgumentException): Response {
        log.debugf("Invalid argument: %s", exception.message)
        return Response
            .status(Response.Status.BAD_REQUEST)
            .entity(ErrorResponseFactory.badRequest(exception.message ?: "Invalid argument"))
            .build()
    }

    private fun handleIllegalStateException(exception: IllegalStateException): Response {
        log.warnf("Invalid state: %s", exception.message)
        return Response
            .status(Response.Status.CONFLICT)
            .entity(ErrorResponseFactory.internalError(exception.message ?: "Invalid state"))
            .build()
    }

    private fun handleNoSuchElementException(exception: NoSuchElementException): Response {
        log.debugf("Element not found: %s", exception.message)
        return Response
            .status(Response.Status.NOT_FOUND)
            .entity(ErrorResponseFactory.notFound("Resource", "unknown"))
            .build()
    }

    private fun handleUnexpectedException(exception: Exception): Response {
        log.errorf(exception, "Unexpected error: %s", exception.message)
        return Response
            .status(Response.Status.INTERNAL_SERVER_ERROR)
            .entity(
                ErrorResponseFactory.internalError(
                    exception.message ?: "An unexpected error occurred",
                ),
            ).build()
    }
}
