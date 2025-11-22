package com.miguoliang.englishlearning.model

import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDateTime

@Table("account_cards")
data class AccountCard(
    @Id
    @Column("id")
    val id: Long? = null,
    @Column("account_id")
    val accountId: Long,
    @Column("knowledge_code")
    val knowledgeCode: String,
    @Column("card_type_code")
    val cardTypeCode: String,
    @Column("ease_factor")
    val easeFactor: BigDecimal,
    @Column("interval_days")
    val intervalDays: Int,
    @Column("repetitions")
    val repetitions: Int,
    @Column("next_review_date")
    val nextReviewDate: LocalDateTime,
    @Column("last_reviewed_at")
    val lastReviewedAt: LocalDateTime?,
    @Column("created_at")
    val createdAt: Instant,
    @Column("updated_at")
    val updatedAt: Instant,
    @Column("created_by")
    val createdBy: String?,
    @Column("updated_by")
    val updatedBy: String?,
)
