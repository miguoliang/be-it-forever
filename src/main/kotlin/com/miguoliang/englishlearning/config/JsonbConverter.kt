package com.miguoliang.englishlearning.config

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.miguoliang.englishlearning.model.Metadata
import org.springframework.core.convert.converter.Converter
import org.springframework.data.convert.ReadingConverter
import org.springframework.data.convert.WritingConverter
import org.springframework.stereotype.Component

/**
 * Converter for JSONB metadata field.
 * Converts between PostgreSQL JSONB (String) and Metadata data class.
 * R2DBC reads JSONB as String, so we convert String <-> Metadata.
 */
@ReadingConverter
@Component
class JsonbToMetadataConverter(
    private val objectMapper: ObjectMapper,
) : Converter<String, Metadata> {
    override fun convert(source: String): Metadata =
        try {
            if (source.isBlank() || source == "null" || source == "{}") {
                Metadata()
            } else {
                objectMapper.readValue<Metadata>(source)
            }
        } catch (e: Exception) {
            // If parsing fails, return empty metadata
            Metadata()
        }
}

@WritingConverter
@Component
class MetadataToJsonbConverter(
    private val objectMapper: ObjectMapper,
) : Converter<Metadata, String> {
    override fun convert(source: Metadata): String =
        try {
            if (source.level == null) {
                "{}"
            } else {
                objectMapper.writeValueAsString(source)
            }
        } catch (e: Exception) {
            // If serialization fails, return empty JSON
            "{}"
        }
}
