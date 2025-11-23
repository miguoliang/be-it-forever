package com.miguoliang.englishlearning.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "card_types")
class CardType(
    @Id
    @Column(name = "code")
    val code: String,
    @Column(name = "name")
    val name: String,
    @Column(name = "description")
    val description: String?,
    @Column(name = "created_at")
    val createdAt: Instant,
    @Column(name = "updated_at")
    val updatedAt: Instant,
    @Column(name = "created_by")
    val createdBy: String?,
    @Column(name = "updated_by")
    val updatedBy: String?,
) {
    override fun equals(other: Any?): Boolean = other is CardType && code == other.code

    override fun hashCode(): Int = code.hashCode()
}
