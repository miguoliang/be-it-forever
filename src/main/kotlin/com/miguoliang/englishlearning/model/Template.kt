package com.miguoliang.englishlearning.model

import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.Instant

@Table("templates")
data class Template(
    @Id
    @Column("code")
    val code: String,
    @Column("name")
    val name: String,
    @Column("description")
    val description: String?,
    @Column("format")
    val format: String?,
    @Column("content")
    val content: ByteArray,
    @Column("created_at")
    val createdAt: Instant,
    @Column("updated_at")
    val updatedAt: Instant,
    @Column("created_by")
    val createdBy: String?,
    @Column("updated_by")
    val updatedBy: String?,
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as Template

        if (code != other.code) return false
        if (name != other.name) return false
        if (description != other.description) return false
        if (format != other.format) return false
        if (!content.contentEquals(other.content)) return false
        if (createdAt != other.createdAt) return false
        if (updatedAt != other.updatedAt) return false
        if (createdBy != other.createdBy) return false
        if (updatedBy != other.updatedBy) return false

        return true
    }

    override fun hashCode(): Int {
        var result = code.hashCode()
        result = 31 * result + name.hashCode()
        result = 31 * result + (description?.hashCode() ?: 0)
        result = 31 * result + (format?.hashCode() ?: 0)
        result = 31 * result + content.contentHashCode()
        result = 31 * result + createdAt.hashCode()
        result = 31 * result + updatedAt.hashCode()
        result = 31 * result + (createdBy?.hashCode() ?: 0)
        result = 31 * result + (updatedBy?.hashCode() ?: 0)
        return result
    }
}
