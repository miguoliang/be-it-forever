package com.miguoliang.englishlearning.model

import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.Instant

@Table("translation_keys")
data class TranslationKey(
    @Id
    @Column("code")
    val code: String,
    @Column("key")
    val key: String,
    @Column("created_at")
    val createdAt: Instant,
    @Column("updated_at")
    val updatedAt: Instant,
    @Column("created_by")
    val createdBy: String?,
    @Column("updated_by")
    val updatedBy: String?,
)
