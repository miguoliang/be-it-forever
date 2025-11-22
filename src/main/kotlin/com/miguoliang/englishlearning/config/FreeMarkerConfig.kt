package com.miguoliang.englishlearning.config

import freemarker.template.Configuration
import freemarker.template.TemplateExceptionHandler
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration as SpringConfiguration

/**
 * FreeMarker configuration for template rendering.
 * Templates are loaded from database (not file system), so we use StringTemplateLoader.
 */
@SpringConfiguration
class FreeMarkerConfig {
    @Bean
    fun freeMarkerConfiguration(): Configuration {
        val cfg = Configuration(Configuration.VERSION_2_3_32)

        // Use StringTemplateLoader since templates are stored in database
        cfg.setTemplateLoader(StringTemplateLoader())

        // Recommended settings
        cfg.defaultEncoding = "UTF-8"
        cfg.templateExceptionHandler = TemplateExceptionHandler.RETHROW_HANDLER
        cfg.logTemplateExceptions = false
        cfg.wrapUncheckedExceptions = true
        cfg.fallbackOnNullLoopVariable = false

        return cfg
    }
}

/**
 * Custom template loader that loads templates from database content (String).
 * Templates are registered dynamically when rendering.
 * Thread-safe implementation using ConcurrentHashMap.
 */
class StringTemplateLoader : freemarker.cache.TemplateLoader {
    private val templates = java.util.concurrent.ConcurrentHashMap<String, String>()

    fun putTemplate(
        name: String,
        content: String,
    ) {
        templates[name] = content
    }

    fun clearTemplate(name: String) {
        templates.remove(name)
    }

    override fun findTemplateSource(name: String): Any? = templates[name]?.let { StringTemplateSource(name, it) }

    override fun getLastModified(templateSource: Any): Long {
        return System.currentTimeMillis() // Templates from DB are considered always current
    }

    override fun getReader(
        templateSource: Any,
        encoding: String,
    ): java.io.Reader {
        val source = templateSource as StringTemplateSource
        return java.io.StringReader(source.content)
    }

    override fun closeTemplateSource(templateSource: Any) {
        // No resources to close for String-based templates
    }

    private data class StringTemplateSource(
        val name: String,
        val content: String,
    )
}
