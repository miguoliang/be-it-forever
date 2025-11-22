package com.miguoliang.englishlearning.model

import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.LocalDateTime

@Table("review_history")
data class ReviewHistory(
    @Id
    @Column("id")
    val id: Long? = null,
    @Column("account_card_id")
    val accountCardId: Long,
    @Column("quality")
    val quality: Int,
    @Column("reviewed_at")
    val reviewedAt: LocalDateTime, // Changed to LocalDateTime to match local_time semantic type
    @Column("created_by")
    val createdBy: String?,
)
