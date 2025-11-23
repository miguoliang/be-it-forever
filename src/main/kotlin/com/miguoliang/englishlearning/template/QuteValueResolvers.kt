package com.miguoliang.englishlearning.template

import io.quarkus.qute.TemplateExtension
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter

/**
 * Qute Template Extensions - Add custom methods to types used in templates.
 * These extensions are automatically available in all Qute templates.
 *
 * Examples:
 * - {myString.truncate(50)} - truncate a string
 * - {myString.capitalize} - capitalize first letter
 * - {myList.isEmpty} - check if list is empty
 */
@TemplateExtension
object StringExtensions {
    /**
     * Truncates a string to specified length with ellipsis.
     * Usage in template: {description.truncate(100)}
     */
    @JvmStatic
    fun truncate(
        str: String,
        maxLength: Int,
    ): String =
        if (str.length <= maxLength) {
            str
        } else {
            str.take(maxLength - 3) + "..."
        }

    /**
     * Capitalizes the first letter of a string.
     * Usage in template: {name.capitalize}
     */
    @JvmStatic
    fun capitalize(str: String): String =
        str.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }

    /**
     * Converts string to lowercase.
     * Usage in template: {name.lower}
     */
    @JvmStatic
    fun lower(str: String): String = str.lowercase()

    /**
     * Converts string to uppercase.
     * Usage in template: {name.upper}
     */
    @JvmStatic
    fun upper(str: String): String = str.uppercase()

    /**
     * Checks if string is empty or blank.
     * Usage in template: {#if description.isBlank}No description{/if}
     */
    @JvmStatic
    fun isBlank(str: String): Boolean = str.isBlank()

    /**
     * Checks if string is not empty or blank.
     * Usage in template: {#if description.isNotBlank}{description}{/if}
     */
    @JvmStatic
    fun isNotBlank(str: String): Boolean = str.isNotBlank()
}

@TemplateExtension
object ListExtensions {
    /**
     * Checks if a list is empty.
     * Usage in template: {#if relatedKnowledge.isEmpty}No related items{/if}
     */
    @JvmStatic
    fun isEmpty(list: List<*>): Boolean = list.isEmpty()

    /**
     * Checks if a list is not empty.
     * Usage in template: {#if relatedKnowledge.isNotEmpty}...{/if}
     */
    @JvmStatic
    fun isNotEmpty(list: List<*>): Boolean = list.isNotEmpty()

    /**
     * Gets the size of a list.
     * Usage in template: {relatedKnowledge.size}
     */
    @JvmStatic
    fun size(list: List<*>): Int = list.size

    /**
     * Gets the first element or null.
     * Usage in template: {relatedKnowledge.firstOrNull.name}
     */
    @JvmStatic
    fun firstOrNull(list: List<*>): Any? = list.firstOrNull()

    /**
     * Gets the last element or null.
     * Usage in template: {relatedKnowledge.lastOrNull.name}
     */
    @JvmStatic
    fun lastOrNull(list: List<*>): Any? = list.lastOrNull()
}

@TemplateExtension
object DateTimeExtensions {
    /**
     * Formats a LocalDateTime to a readable string.
     * Usage in template: {createdAt.format('yyyy-MM-dd HH:mm')}
     */
    @JvmStatic
    fun format(
        dateTime: LocalDateTime,
        pattern: String,
    ): String = DateTimeFormatter.ofPattern(pattern).format(dateTime)

    /**
     * Formats an Instant to a readable string.
     * Usage in template: {updatedAt.format('yyyy-MM-dd HH:mm')}
     */
    @JvmStatic
    fun format(
        instant: Instant,
        pattern: String,
    ): String {
        val localDateTime = LocalDateTime.ofInstant(instant, ZoneId.systemDefault())
        return DateTimeFormatter.ofPattern(pattern).format(localDateTime)
    }

    /**
     * Converts Instant to LocalDateTime.
     * Usage in template: {instant.toLocalDateTime}
     */
    @JvmStatic
    fun toLocalDateTime(instant: Instant): LocalDateTime = LocalDateTime.ofInstant(instant, ZoneId.systemDefault())
}

@TemplateExtension
object NumberExtensions {
    /**
     * Formats a number with specified decimal places.
     * Usage in template: {score.formatDecimal(2)}
     */
    @JvmStatic
    fun formatDecimal(
        number: Number,
        decimalPlaces: Int,
    ): String = String.format("%.${decimalPlaces}f", number.toDouble())

    /**
     * Formats a number as percentage.
     * Usage in template: {accuracy.formatPercent}
     */
    @JvmStatic
    fun formatPercent(number: Number): String = String.format("%.1f%%", number.toDouble() * 100)
}
