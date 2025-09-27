#!/usr/bin/env python3
"""Test script for filename sanitization"""

import sys
import os
from pathlib import Path

# Add the backend app to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.image_store import sanitize_filename

def test_sanitize_filename():
    """Test various edge cases for filename sanitization"""
    test_cases = [
        # (input, expected_output, description)
        ('1/4" Sockets', '14_Sockets', 'Special characters / and "'),
        ('Normal Name', 'Normal_Name', 'Spaces to underscores'),
        ('file<>name', 'filename', 'Angle brackets removed'),
        ('path\\to\\file', 'pathtofile', 'Backslashes removed'),
        ('file:name', 'filename', 'Colon removed'),
        ('file*name?', 'filename', 'Asterisk and question mark removed'),
        ('file|name', 'filename', 'Pipe character removed'),
        ('   spaced   name   ', 'spaced_name', 'Leading/trailing spaces'),
        ('multiple___underscores', 'multiple___underscores', 'Multiple underscores preserved'),
        ('français', 'francais', 'Accented characters normalized'),
        ('', 'item', 'Empty string fallback'),
        ('   ', 'item', 'Whitespace only fallback'),
        ('!!!@@@###', 'item', 'Only special characters fallback'),
        ('a' * 50, 'a' * 40, 'Long string truncation'),
        ('very_long_item_name_that_exceeds_limit', 'very_long_item_name_that_exceeds', 'Truncation at word boundary'),
        ('short_name_with_very_long_ending_abcdefghijklmnop', 'short_name_with_very_long_ending', 'Smart truncation'),
    ]
    
    print("Testing filename sanitization:")
    print("=" * 60)
    
    all_passed = True
    for i, (input_str, expected, description) in enumerate(test_cases, 1):
        result = sanitize_filename(input_str)
        passed = result == expected
        all_passed = all_passed and passed
        
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{i:2d}. {status} {description}")
        print(f"    Input:    '{input_str}'")
        print(f"    Expected: '{expected}'")
        print(f"    Got:      '{result}'")
        if not passed:
            print(f"    *** MISMATCH ***")
        print()
    
    print("=" * 60)
    print(f"Overall result: {'All tests passed!' if all_passed else 'Some tests failed!'}")
    return all_passed

if __name__ == "__main__":
    test_sanitize_filename()