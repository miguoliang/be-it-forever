package com.miguoliang.englishlearning.model

import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.Instant

@Table("card_type_template_rel")
data class CardTypeTemplateRel(
    @Id
    @Column("id")
    val id: Long? = null,
    @Column("card_type_code")
    val cardTypeCode: String,
    @Column("template_code")
    val templateCode: String,
    @Column("role")
    val role: String,
    @Column("created_at")
    val createdAt: Instant,
    @Column("updated_at")
    val updatedAt: Instant,
    @Column("created_by")
    val createdBy: String?,
    @Column("updated_by")
    val updatedBy: String?,
)
