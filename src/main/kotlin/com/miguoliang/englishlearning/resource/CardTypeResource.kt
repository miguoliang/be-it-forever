package com.miguoliang.englishlearning.resource

import com.miguoliang.englishlearning.common.PageRequest
import com.miguoliang.englishlearning.dto.PageDto
import com.miguoliang.englishlearning.dto.PageInfoDto
import com.miguoliang.englishlearning.dto.toDto
import com.miguoliang.englishlearning.service.CardTypeService
import jakarta.ws.rs.Consumes
import jakarta.ws.rs.DefaultValue
import jakarta.ws.rs.GET
import jakarta.ws.rs.Path
import jakarta.ws.rs.PathParam
import jakarta.ws.rs.Produces
import jakarta.ws.rs.QueryParam
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response

/**
 * REST resource for Card Type endpoints.
 * Access: Both operator and client roles (read-only).
 */
@Path("/api/v1/card-types")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
class CardTypeResource(
    private val cardTypeService: CardTypeService,
) {
    /**
     * List all available card types with database-level pagination.
     * GET /api/v1/card-types
     *
     * This endpoint now uses proper database pagination instead of loading all records into memory.
     * Pagination happens at the database level for better performance and scalability.
     */
    @GET
    suspend fun listCardTypes(
        @QueryParam("page") @DefaultValue("0") page: Int,
        @QueryParam("size") @DefaultValue("20") size: Int,
    ): Response {
        // Create pagination request
        val pageable = PageRequest.of(page, size)

        // Get paginated results from service (database-level pagination)
        val pageResult = cardTypeService.getCardTypes(pageable)

        // Convert to DTO
        return Response
            .ok(
                PageDto(
                    content = pageResult.content.map { it.toDto() },
                    page =
                        PageInfoDto(
                            number = pageResult.number,
                            size = pageResult.size,
                            totalElements = pageResult.totalElements,
                            totalPages = pageResult.totalPages,
                        ),
                ),
            ).build()
    }

    /**
     * Get a specific card type.
     * GET /api/v1/card-types/{code}
     */
    @GET
    @Path("/{code}")
    suspend fun getCardType(
        @PathParam("code") code: String,
    ): Response {
        val cardType =
            cardTypeService.getCardTypeByCode(code)
                ?: throw com.miguoliang.englishlearning.exception
                    .NotFoundException("CardType", code)

        return Response.ok(cardType.toDto()).build()
    }
}
