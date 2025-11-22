package com.miguoliang.englishlearning.model

import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.Instant

@Table("knowledge_rel")
data class KnowledgeRel(
    @Id
    @Column("id")
    val id: Long? = null,
    @Column("source_knowledge_code")
    val sourceKnowledgeCode: String,
    @Column("target_knowledge_code")
    val targetKnowledgeCode: String,
    @Column("created_at")
    val createdAt: Instant,
    @Column("updated_at")
    val updatedAt: Instant,
    @Column("created_by")
    val createdBy: String?,
    @Column("updated_by")
    val updatedBy: String?,
)
