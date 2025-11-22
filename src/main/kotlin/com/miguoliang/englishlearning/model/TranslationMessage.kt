package com.miguoliang.englishlearning.model

import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.Instant

@Table("translation_messages")
data class TranslationMessage(
    @Id
    @Column("code")
    val code: String,
    @Column("translation_key_code")
    val translationKeyCode: String,
    @Column("locale_code")
    val localeCode: String,
    @Column("message")
    val message: String,
    @Column("created_at")
    val createdAt: Instant,
    @Column("updated_at")
    val updatedAt: Instant,
    @Column("created_by")
    val createdBy: String?,
    @Column("updated_by")
    val updatedBy: String?,
)
