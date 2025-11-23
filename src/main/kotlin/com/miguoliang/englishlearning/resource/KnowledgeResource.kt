package com.miguoliang.englishlearning.resource

import com.miguoliang.englishlearning.common.PageRequest
import com.miguoliang.englishlearning.dto.PageDto
import com.miguoliang.englishlearning.dto.PageInfoDto
import com.miguoliang.englishlearning.dto.toDto
import com.miguoliang.englishlearning.service.KnowledgeService
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
 * REST resource for Knowledge endpoints.
 * Access: Both operator and client roles (read-only for clients, full CRUD for operators).
 */
@Path("/api/v1/knowledge")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
class KnowledgeResource(
    private val knowledgeService: KnowledgeService,
) {
    /**
     * List knowledge items with optional filtering.
     * GET /api/v1/knowledge
     */
    @GET
    suspend fun listKnowledge(
        @QueryParam("page") @DefaultValue("0") page: Int,
        @QueryParam("size") @DefaultValue("20") size: Int,
    ): Response {
        val pageable = PageRequest.of(page, size)
        val pageResult = knowledgeService.getKnowledge(pageable)

        val content = pageResult.content.map { it.toDto() }
        return Response
            .ok(
                PageDto(
                    content = content,
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
     * Get a specific knowledge item.
     * GET /api/v1/knowledge/{code}
     */
    @GET
    @Path("/{code}")
    suspend fun getKnowledge(
        @PathParam("code") code: String,
    ): Response {
        val knowledge =
            knowledgeService.getKnowledgeByCode(code)
                ?: throw com.miguoliang.englishlearning.exception
                    .NotFoundException("Knowledge", code)

        return Response.ok(knowledge.toDto()).build()
    }
}
