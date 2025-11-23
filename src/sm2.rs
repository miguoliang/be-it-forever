use rust_decimal::Decimal;
use rust_decimal::prelude::ToPrimitive;
use std::str::FromStr;

/// SM-2 algorithm implementation for spaced repetition
pub struct Sm2Algorithm;

impl Sm2Algorithm {
    /// Calculate next review state based on quality rating (0-5)
    pub fn calculate_next_review(
        current_ease_factor: Decimal,
        current_interval_days: i32,
        current_repetitions: i32,
        quality: i32,
    ) -> (Decimal, i32, i32) {
        let min_ease_factor = Decimal::from_str("1.3").unwrap();
        let mut ease_factor = current_ease_factor;
        let mut interval_days: i32;
        let mut repetitions = current_repetitions;

        if quality < 3 {
            // Failed: Reset to beginning
            repetitions = 0;
            interval_days = 1;
            // Decrease ease factor by 0.2
            ease_factor -= Decimal::from_str("0.2").unwrap();
            if ease_factor < min_ease_factor {
                ease_factor = min_ease_factor;
            }
        } else {
            // Passed: Increase repetitions
            repetitions += 1;

            // Adjust ease factor based on quality
            let quality_decimal = Decimal::from(quality);
            ease_factor = ease_factor + (Decimal::from_str("0.1").unwrap() - (Decimal::from(5) - quality_decimal) * (Decimal::from_str("0.08").unwrap() + (Decimal::from(5) - quality_decimal) * Decimal::from_str("0.02").unwrap()));

            if ease_factor < min_ease_factor {
                ease_factor = min_ease_factor;
            }

            // Calculate new interval
            interval_days = match repetitions {
                1 => 1,
                2 => 6,
                _ => {
                    let factor = ease_factor.to_f64().unwrap_or(2.5);
                    (current_interval_days as f64 * factor).round() as i32
                }
            };
        }

        (ease_factor, interval_days, repetitions)
    }

    /// Create initial SM-2 values for a new card
    pub fn initial_values() -> (Decimal, i32, i32) {
        (
            Decimal::from_str("2.5").unwrap(), // Initial ease factor
            1,                                   // Initial interval (1 day)
            0,                                   // Initial repetitions
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_initial_values() {
        let (ease_factor, interval_days, repetitions) = Sm2Algorithm::initial_values();
        assert_eq!(ease_factor, Decimal::from_str("2.5").unwrap());
        assert_eq!(interval_days, 1);
        assert_eq!(repetitions, 0);
    }

    #[test]
    fn test_failed_review() {
        let (ease_factor, interval_days, repetitions) = Sm2Algorithm::calculate_next_review(
            Decimal::from_str("2.5").unwrap(),
            6,
            2,
            2, // Failed
        );
        assert_eq!(interval_days, 1);
        assert_eq!(repetitions, 0);
        assert!(ease_factor < Decimal::from_str("2.5").unwrap());
    }

    #[test]
    fn test_passed_review_first() {
        let (ease_factor, interval_days, repetitions) = Sm2Algorithm::calculate_next_review(
            Decimal::from_str("2.5").unwrap(),
            1,
            0,
            4, // Good
        );
        assert_eq!(interval_days, 1);
        assert_eq!(repetitions, 1);
    }

    #[test]
    fn test_passed_review_second() {
        let (ease_factor, interval_days, repetitions) = Sm2Algorithm::calculate_next_review(
            Decimal::from_str("2.5").unwrap(),
            1,
            1,
            4, // Good
        );
        assert_eq!(interval_days, 6);
        assert_eq!(repetitions, 2);
    }
}
