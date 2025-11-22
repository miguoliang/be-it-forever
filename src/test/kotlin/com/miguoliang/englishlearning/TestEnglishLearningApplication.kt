package com.miguoliang.englishlearning

import org.springframework.boot.fromApplication
import org.springframework.boot.with

fun main(args: Array<String>) {
    fromApplication<EnglishLearningApplication>().with(TestcontainersConfiguration::class).run(*args)
}
