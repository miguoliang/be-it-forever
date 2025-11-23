package com.miguoliang.englishlearning.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "card_type_template_rel")
class CardTypeTemplateRel(
    @Id
    @Column(name = "id")
    val id: Long? = null,
    @Column(name = "card_type_code")
    val cardTypeCode: String,
    @Column(name = "template_code")
    val templateCode: String,
    @Column(name = "role")
    val role: String,
    @Column(name = "created_at")
    val createdAt: Instant,
    @Column(name = "updated_at")
    val updatedAt: Instant,
    @Column(name = "created_by")
    val createdBy: String?,
    @Column(name = "updated_by")
    val updatedBy: String?,
) {
    override fun equals(other: Any?): Boolean {
        if (other !is CardTypeTemplateRel) return false
        return cardTypeCode == other.cardTypeCode &&
            templateCode == other.templateCode &&
            role == other.role
    }

    override fun hashCode(): Int {
        var result = cardTypeCode.hashCode()
        result = 31 * result + templateCode.hashCode()
        result = 31 * result + role.hashCode()
        return result
    }
}
