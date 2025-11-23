package com.miguoliang.englishlearning.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDateTime

@Entity
@Table(
    name = "account_cards",
    indexes = [
        Index(columnList = "account_id", name = "idx_account_cards_account_id"),
        Index(columnList = "account_id,next_review_date", name = "idx_account_cards_account_next_review"),
        Index(columnList = "account_id,card_type_code", name = "idx_account_cards_account_card_type"),
        Index(columnList = "knowledge_code", name = "idx_account_cards_knowledge"),
        Index(columnList = "card_type_code", name = "idx_account_cards_card_type"),
    ],
)
data class AccountCard(
    @Id
    @Column(name = "id")
    val id: Long? = null,
    @Column(name = "account_id")
    val accountId: Long,
    @Column(name = "knowledge_code")
    val knowledgeCode: String,
    @Column(name = "card_type_code")
    val cardTypeCode: String,
    @Column(name = "ease_factor")
    val easeFactor: BigDecimal,
    @Column(name = "interval_days")
    val intervalDays: Int,
    @Column(name = "repetitions")
    val repetitions: Int,
    @Column(name = "next_review_date")
    val nextReviewDate: LocalDateTime,
    @Column(name = "last_reviewed_at")
    val lastReviewedAt: LocalDateTime?,
    @Column(name = "created_at")
    val createdAt: Instant,
    @Column(name = "updated_at")
    val updatedAt: Instant,
    @Column(name = "created_by")
    val createdBy: String?,
    @Column(name = "updated_by")
    val updatedBy: String?,
)
