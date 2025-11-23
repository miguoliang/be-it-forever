package com.miguoliang.englishlearning.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(
    name = "knowledge_rel",
    indexes = [
        Index(columnList = "source_knowledge_code", name = "idx_knowledge_rel_source"),
        Index(columnList = "target_knowledge_code", name = "idx_knowledge_rel_target"),
    ],
)
data class KnowledgeRel(
    @Id
    @Column(name = "id")
    val id: Long? = null,
    @Column(name = "source_knowledge_code")
    val sourceKnowledgeCode: String,
    @Column(name = "target_knowledge_code")
    val targetKnowledgeCode: String,
    @Column(name = "created_at")
    val createdAt: Instant,
    @Column(name = "updated_at")
    val updatedAt: Instant,
    @Column(name = "created_by")
    val createdBy: String?,
    @Column(name = "updated_by")
    val updatedBy: String?,
)
