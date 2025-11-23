package com.miguoliang.englishlearning.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(
    name = "review_history",
    indexes = [
        Index(columnList = "account_card_id", name = "idx_review_history_account_card"),
    ],
)
class ReviewHistory(
    @Id
    @Column(name = "id")
    val id: Long? = null,
    @Column(name = "account_card_id")
    val accountCardId: Long,
    @Column(name = "quality")
    val quality: Int,
    @Column(name = "reviewed_at")
    val reviewedAt: LocalDateTime,
    @Column(name = "created_by")
    val createdBy: String?,
) {
    override fun equals(other: Any?): Boolean {
        if (other !is ReviewHistory) return false
        return accountCardId == other.accountCardId &&
            reviewedAt == other.reviewedAt
    }

    override fun hashCode(): Int {
        var result = accountCardId.hashCode()
        result = 31 * result + reviewedAt.hashCode()
        return result
    }
}
