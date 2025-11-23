package com.miguoliang.englishlearning.config

import freemarker.cache.StringTemplateLoader
import freemarker.template.Configuration
import jakarta.enterprise.context.ApplicationScoped
import jakarta.enterprise.inject.Produces
import jakarta.inject.Singleton

@ApplicationScoped
class FreeMarkerConfig {
    @Produces
    @Singleton
    fun freeMarkerConfiguration(): Configuration {
        val config = Configuration(Configuration.VERSION_2_3_32)
        config.templateLoader = StringTemplateLoader()
        config.defaultEncoding = "UTF-8"
        return config
    }
}
